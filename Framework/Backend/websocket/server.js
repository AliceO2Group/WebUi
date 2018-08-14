const WebSocketServer = require('ws').Server;
const url = require('url');
const log = new (require('./../log/log.js'))('WebSocket');
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
    log.info('WebSocket server started');
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
  processRequest(req) {
    return new Promise((resolve, reject) => {
      // 1. Verify JWT token
      this.http.jwt.verify(req.getToken())
        .then((data) => {
          // 2. Transfer decoded JWT data to request
          Object.assign(req, data);
          log.debug(`${data.id}: command [${req.getCommand()}] processing`);
          // 3. Check whether callback exists
          if (this.callbackArray.hasOwnProperty(req.getCommand())) {
            const res = this.callbackArray[req.getCommand()](req);
            // 4. Verify that response is type of WebSocketMessage
            if (res && res.constructor.name === 'WebSocketMessage') {
              if (typeof res.getCommand() !== 'string') {
                res.setCommand(req.getCommand());
              }
              resolve(res);
            } else {
              // 5. 500 when callback does not return WebSocketMessage
              resolve(new WebSocketMessage(500));
            }
          } else {
            // 6. When callback does not exist return 404
            resolve(new WebSocketMessage(404));
          }
        }, (error) => {
          // 7. When JWT fails
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
    const token = url.parse(request.url, true).query.token;
    this.http.jwt.verify(token)
      .then(() => {
        client.send(JSON.stringify({command: 'authed'}));
        client.on('message', (message) => this.onmessage(message, client));
        client.on('close', () => this.onclose());
        client.on('pong', () => client.isAlive = true);
        client.on('error', (err) => log.error(`WebSocket - Connection ${err.code}`));
      }, (error) => {
        log.warn(`WebSocket - ${error.name} : ${error.message}`);
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
    // 1. parse message
    new WebSocketMessage().parse(message)
      .then((parsed) => {
        // 2. Check if its message filter (no auth required)
        if (parsed.getCommand() == 'filter' && parsed.getPayload()) {
          client.filter = new Function('return ' + parsed.getPayload())();
        }
        // 3. Get reply if callback exists
        this.processRequest(parsed)
          .then((response) => {
            // 4. Broadcast if necessary
            if (response.getBroadcast()) {
              this.broadcast(response);
            } else {
              log.debug(`WebSocket - [${response.getCommand()}/${response.getCode()}] sent`);
              // 5. Send back to a client
              client.send(JSON.stringify(response.json));
            }
          }, (response) => {
            // 6. If generating response fails
            throw new Error(`Websocket - processRequest failed: ${response.message}`);
          });
      }, (failed) => {
        // 7. If parsing message fails
        client.send(JSON.stringify(failed.json));
      }).catch((error) => {
        log.warn(`WebSocket - ${error.name} : ${error.message}`);
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
    log.info('WebSocket - disconnected');
  }

  /**
   * Broadcasts the message to all connected clients.
   * @param {string} message
   */
  broadcast(message) {
    this.server.clients.forEach(function(client) {
      if (typeof client.filter === 'function') {
        // Handle function execution error, filter comes from WS
        try {
          if (!client.filter(message)) {
            return; // don't send
          }
        } catch (error) {
          log.error(`filter's client corrupted, skipping his broadcast: ${error}`);
          return; // don't send
        }
      }
      client.send(JSON.stringify(message.json));
    });
    log.debug(`WebSocket - [${message.getCommand()}/${message.getCode()}] broadcast`);
  }
}
module.exports = WebSocket;
