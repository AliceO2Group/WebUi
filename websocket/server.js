const WebSocketServer = require('ws').Server;
const url = require('url');
const log = require('./../log.js');
const WebSocketMessage = require('./message.js');

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
    this.bind('filter', (message) => {
      return new WebSocketMessage(200).setCommand(message.getCommand());
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
   * @param {function} callback - callback function, that receives message object
   */
  bind(name, callback) {
    if (this.callbackArray.hasOwnProperty(name)) {
      throw Error('WebSocket callback already exists.');
    }
    this.callbackArray[name] = callback;
  }

  /**
   * Handles incoming text messages: verifies token and processes request/command.
   * @param {object} req
   * @return {object} message to be send back to the user
   */
  getReply(req) {
    return new Promise((resolve, reject) => {
      const responseArray = [];
      this.http.jwt.verify(req.getToken())
        .then((data) => {
          if (data.newToken) {
            responseArray.push(new WebSocketMessage(440)
              .setCommand('new-token')
              .setPayload({newtoken: data.newToken})
            );
          }
          req.id = data.id;
          log.debug('%d : command %s', data.id, req.getCommand());
          if (this.callbackArray.hasOwnProperty(req.getCommand())) {
            const res = this.callbackArray[req.getCommand()](req);
            if (res.constructor.name === 'WebSocketMessage') {
              if (typeof res.getCommand() !== 'string') {
                res.setCommand(req.getCommand());
              }
              responseArray.push(res);
            } else {
              responseArray.push(new WebSocketMessage(500));
            }
          } else {
            responseArray.push(new WebSocketMessage(404));
          }
          resolve(responseArray);
        }, (error) => {
          reject(error);
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
        client.on('message', (message) => this.onmessage(message, client));
        client.on('close', () => this.onclose());
        client.on('pong', () => client.isAlive = true);
      }, (error) => {
        log.warn('Websocket: oAuth failed', error.message);
        client.close(1008);
      });
  }

  /**
   * Called when a new message arrivies
   * Handles connection with a client
   * @param {object} message received message
   * @param {object} client TCP socket of the client
   */
  onmessage(message, client) {
    new WebSocketMessage().parse(message)
      .then((parsed) => {
        // add filter to a client
        if ((parsed.getCommand() == 'filter') &&
          (typeof parsed.getProperty('filter') === 'string')) {
          client.filter = new Function('return ' + parsed.getProperty('filter').toString())();
        }
        // message reply
        this.getReply(parsed)
          .then((responses) => {
            for (let res of responses) {
              if (res.getBroadcast()) {
                this.broadcast(res);
              } else {
                log.debug('command %s sent', res.getCommand());
                client.send(JSON.stringify(res.json));
              }
            }
          }, (response) => {
            throw new Error('Websocket: getReply() failed', response.message);
          });
      }, (failed) => {
        client.send(JSON.stringify(failed.json));
      }).catch((error) => {
        log.warn(error.message);
        client.close(1008);
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
        if (!client.filter(message.getPayload())) {
          return;
        }
      }
      client.send(JSON.stringify(message.json));
    });
    log.debug('broadcast : command %s sent', message.getCommand());
  }
}
module.exports = WebSocket;
