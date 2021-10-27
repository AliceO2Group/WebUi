/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const WebSocketServer = require('ws').Server;
const url = require('url');
const Log = require('./../log/Log.js');
const WebSocketMessage = require('./message.js');

/**
 * It represents WebSocket server (RFC 6455).
 * In addition, it provides custom authentication with JWT tokens.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class WebSocket {
  /**
   * Starts up the server and binds event handler.
   * @param {object} httpsServer - HTTPS server instance
   * @constructor
   */
  constructor(httpsServer) {
    this.http = httpsServer;
    this.server = new WebSocketServer({server: httpsServer.getServer, clientTracking: true});
    this.server.on('connection', (client, request) => this.onconnection(client, request));

    this.log = new Log(`${process.env.npm_config_log_label ?? 'framework'}/ws`);
    this.log.info('Server started');

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
   * Binds callback to websocket message command
   * Name "filter" is reserved for internal use
   * @param {string} name       - command name
   * @param {function} callback - function that receives message as WebSocketMessage object;
   *                              it can send a response back to client by returning WebSocketMessage instance
   */
  bind(name, callback) {
    if (this.callbackArray.hasOwnProperty(name)) {
      throw Error('Callback already exists.');
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
          this.log.debug(`ID ${data.id} Processing "${req.getCommand()}"`);
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
      .then((decoded) => {
        client.id = decoded.id;
        client.send(JSON.stringify({command: 'authed', id: client.id}));
        client.on('message', (message) => this.onmessage(message, client));
        client.on('close', () => this.onclose(client));
        client.on('pong', () => client.isAlive = true);
        client.on('error', (err) => this.log.error(`Connection ${err.code}`));
      }, (error) => {
        this.log.debug(`${error.name} : ${error.message}`);
        client.close(1008);
      });
  }

  /**
   * Called when a new message arrives
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
              this.log.debug(`ID ${client.id} Sent ${response.getCommand()}/${response.getCode()}`);
              // 5. Send back to a client
              client.send(JSON.stringify(response.json));
            }
          }, (response) => {
            // 6. If generating response fails
            throw new Error(`ID ${client.id} Processing request failed: ${response.message}`);
          });
      }, (failed) => {
        // 7. If parsing message fails
        client.send(JSON.stringify(failed.json));
      }).catch((error) => {
        this.log.warn(`ID ${client.id} ${error.name} : ${error.message}`);
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
        client.ping('', false, (err) => {
          if (err) {
            this.log.error(err);
            if (err.stack) {
              this.log.trace(err);
            }
          }
        });
      });
    }, 30000);
  }

  /**
   * Handles client disconnection.
   * @param {object} client - disconnected client
   */
  onclose(client) {
    this.log.info(`ID ${client.id} Client disconnected`);
  }

  /**
   * Broadcasts the message to all connected clients
   * The message must match client's filter (if filter is set)
   * @param {WebSocketMessage} message
   */
  broadcast(message) {
    this.server.clients.forEach((client) => {
      if (typeof client.filter === 'function') {
        // Handle function execution error, filter comes from WS
        try {
          if (!client.filter(message)) {
            return; // don't send
          }
        } catch (error) {
          this.log.error(`Client's filter corrupted, skipping broadcast: ${error}`);
          return; // don't send
        }
      }
      client.send(JSON.stringify(message.json));
      this.log.debug(`ID ${client.id} Broadcast ${message.getCommand()}/${message.getCode()}`);
    });
  }

  /**
   * Broadcasts messages to all connected clients.
   * @param {WebSocketMessage} message
   */
  unfilteredBroadcast(message) {
    this.server.clients.forEach((client) => client.send(JSON.stringify(message.json)));
    this.log.debug(`Unfiltered broadcast ${message.getCommand()}/${message.getCode()}`);
  }
}
module.exports = WebSocket;
