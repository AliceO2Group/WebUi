const WebSocketServer = require('ws').Server;
const url = require('url');
const log = require('./../log.js');
const Response = require('./response.js');

/**
 * It represents WebSocket server (RFC 6455).
 * In addition, it provides custom authentication with JWT tokens.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class WebSocket {
  /**
   * Starts up the server and binds event handler.
   * @param {object} httpsServer - HTTPS server
   * @param {object} jwtConfig - configuration of jwt
   * @param {string} hostname - hostname that clients will be conneting to
   * @constructor
   */
  constructor(httpsServer) {
    this.http = httpsServer;
    this.server = new WebSocketServer({server: httpsServer.getServer, clientTracking: true});
    this.server.on('connection', (client, request) => this.onconnection(client, request));
    log.debug('WebSocket server started');
    this.callbackArray = [];
    this.bind('filter', () => {
      return new Response(200);
    });
    this.ping();
  }

  /**
   * Shutdown WebSocket server cleanly
   */
  shutdown() {
    clearInterval(this.interval);
    this.server.close();
  }

  /**
   * Binds callback to websocket message (depending on message name)
   * Message as an Object is passed to the callback
   * @param {string} name - websocket message name
   * @param {function} callback - callback function
   */
  bind(name, callback) {
    if (this.callbackArray.hasOwnProperty(name)) {
      throw Error('WebSocket callback already exists.');
    }
    this.callbackArray[name] = callback;
  }

  /**
   * Handles incoming text messages: verifies token and processes request/command.
   * @param {object} message
   * @return {object} message to be send back to the user
   */
  onmessage(message) {
    return new Promise((resolve, reject) => {
      if (typeof message === 'undefined') {
        reject([new Response(403)]);
      }
      const responseArray = [];
      this.jwtVerify(message.token)
        .then((data) => {
          if (data.newToken) {
            responseArray.push(
              new Response(440).command('new-token').payload({newtoken: data.newToken})
            );
          }
          message.id = data.id;
          log.debug('%d : command %s', message.id, message.command);
          if (this.callbackArray.hasOwnProperty(message.command)) {
            responseArray.push(this.callbackArray[message.command](message));
          } else {
            responseArray.push(new Response(404));
          }
          resolve(responseArray);
        }, () => {
          reject([new Response(401)]);
        });
    });
  }

  /**
   * Verifies token, if expired requests a new one.
   * @param {object} token - JWT token
   * @return {object} includes either parsed token or response message
   */
  jwtVerify(token) {
    return new Promise((resolve, reject) => {
      this.jwt.verify(token)
        .then((data) => {
          resolve(data);
        }, (err) => {
          reject(err);
        });
    });
  }

  /**
   * Handles client connection and message receiving.
   * @param {object} client - connected client
   * @param {object} request - connection request
   */
  onconnection(client, request) {
    const oauth = url.parse(request.url, true).query.oauth;
    this.http.oauth.getDetails(oauth, this.http.oauth.userOptions)
      .then(() => {
        client.send(JSON.stringify({command: 'authed'}));
        client.on('message', (message) => {
          const parsed = JSON.parse(message);
          // add filter to a client
          if (parsed.command == 'filter') {
            client.filter = new Function('return ' + parsed.filter.toString())();
          }
          this.onmessage(parsed)
            .then((responses) => {
              for (let response of responses) {
                if (response.getcommand == undefined) {
                  response.command(parsed.command);
                }
                if (response.getbroadcast) {
                  log.debug('broadcast : command %s sent', response.getcommand);
                  this.broadcast(response.json);
                } else {
                  log.debug('command %s sent', response.getcommand);
                  client.send(JSON.stringify(response.json));
                }
              }
            }, (response) => {
              client.send(JSON.stringify(response.json));
            });
        });
        client.on('close', () => this.onclose());
        client.on('pong', () => client.isAlive = true);
      }, () => {
        throw new Error('WebSocket: oAuth promise rejection');
      }).catch(() => {
        client.close(1008);
        log.warn('Websocket: OAuth authentication faild');
      });
  }

  /**
   * Sends ping message every 30s
   */
  ping() {
    this.interval = setInterval(() => {
      this.server.clients.forEach(function(client) {
        if (client.isAlive === false) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping('', false, true);
      });
    }, 30000);
  }

  /**
   * Handles client disconnection.
   * @param {object} client - disconnected client
   */
  onclose() {
    log.info('disconnected');
  }

  /**
   * Broadcasts the message to all connected clients.
   * @param {string} message
   */
  broadcast(message) {
    this.server.clients.forEach(function(client) {
      if (typeof client.filter === 'function') {
        if (!client.filter(message.payload)) {
          return;
        }
      }
      client.send(JSON.stringify(message));
    });
  }
}
module.exports = WebSocket;
