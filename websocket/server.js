const EventEmitter = require('events');
const WebSocketServer = require('ws').Server;
const url = require('url');
const log = require('./../log.js');
const Response = require('./response.js');

/**
 * It represents WebSocket server (RFC 6455).
 * In addition, it provides custom authentication with JWT tokens.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class WebSocket extends EventEmitter {
  /**
   * Starts up the server and binds event handler.
   * @param {object} httpsServer - HTTPS server
   * @param {object} jwtConfig - configuration of jwt
   * @param {string} hostname - hostname that clients will be conneting to
   * @constructor
   */
  constructor(httpsServer, jwtConfig, hostname) {
    super();
    this.http = httpsServer;
    this.server = new WebSocketServer({server: httpsServer.server, clientTracking: true});
    this.server.on('connection', (client, request) => this.onconnection(client, request));
    log.debug('WebSocket server started');
    this.callbackArray = [];
    this.bind('filter', () => {
      return new Response(200);
    });
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
    if (typeof message === 'undefined') {
      return;
    }
    const responseArray = [];
    let feedback = this.jwtVerify(message.token);
    if (feedback instanceof Response && feedback.getcode != 440) {
      return [feedback];
    } else if (feedback instanceof Response && feedback.getcode == 440) {
      responseArray.push(feedback);
      feedback = this.jwtVerify(feedback.getpayload.newtoken);
    }
    message.id = feedback.id;

    log.debug('%d : command %s', message.id, message.command);
    if (this.callbackArray.hasOwnProperty(message.command)) {
      const response = this.callbackArray[message.command](message);
      responseArray.push(response);
    } else {
      responseArray.push(new Response(404));
    }
    return responseArray;
  }

  /**
   * Verifies token, if expired requests a new one.
   * @param {object} token - JWT token
   * @param {bool} refresh - whether try to refresh token when expired or not
   * @return {object} includes either parsed token or response message
   */
  jwtVerify(token, refresh = true) {
    try {
      return this.http.jwt.verify(token);
    } catch (err) {
      log.warn('jwt verify failed: %s', err.message);
      if (err.name == 'TokenExpiredError' && refresh) {
        const newtoken = this.http.jwt.refreshToken(token);
        if (newtoken === false) {
          return new Response(403);
        }
        return new Response(440).command('new-token').payload({newtoken: newtoken});
      } else {
        return new Response(401);
      }
    }
  }

  /**
   * Handles client connection and message receiving.
   * @param {object} client - connected client
   * @param {object} request - connection request
   */
  onconnection(client, request) {
    const oauth = url.parse(request.url, true).query.oauth;
    this.http.oauth.oAuthGetUserDetails(oauth)
      .then(() => {
        client.send(JSON.stringify({command: 'authed'}));
        client.on('message', (message, flags) => {
          const parsed = JSON.parse(message);
          // add filter to a client
          if (parsed.command == 'filter') {
            client.filter = new Function('return ' + parsed.filter.toString())();
          }
          const response = this.onmessage(parsed);
          for (let message of response) {
            if (message.getcommand == undefined) {
              message.command(parsed.command);
            }
            if (message.getbroadcast) {
              log.debug('broadcast : command %s sent', message.getcommand);
              this.broadcast(message.json);
            } else {
              log.debug('command %s sent', message.getcommand);
              client.send(JSON.stringify(message.json));
            }
          }
        });
        client.on('close', (client) => this.onclose(client));
        client.on('pong', () => client.isAlive = true);
      }, () => {
        throw new Error('OAuth promise rejection');
      }).catch((err) => {
        client.close(1008);
        log.warn('Websocket: OAuth authentication faild');
      });
  }

  /**
   * Sends ping message every 30s
   */
  ping() {
    setInterval(() => {
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
  onclose(client) {
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
