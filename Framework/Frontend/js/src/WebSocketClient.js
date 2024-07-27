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

/* Global: window */

import sessionService from './sessionService.js';
import EventEmitter from './EventEmitter.js';

const { location } = window;

/**
 * `open` event.
 *
 * @event WebSocketClient#open
 */

/**
 * `error` event.
 * See `close` event for more details on why.
 *
 * @event WebSocketClient#error
 * @type {WebSocketMessage}
 * @property {number} code
 * @property {string} message
 * @property {object} payload
 */

/**
 * `close` event.
 * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
 *
 * @event WebSocketClient#close
 * @type {CloseEvent}
 * @property {string} reason
 * @property {number} code
 */

/**
 * `authed` event when WSClient is authentificated by server
 * and can process incoming requests.
 *
 * @event WebSocketClient#authed
 */

/**
 * `token` event when new auth token has been made
 * sessionService is also refreshed.
 *
 * @event WebSocketClient#token
 */

/**
 * `command` event when a custom command is received.
 *
 * @event WebSocketClient#command
 * @type {WebSocketMessage}
 * @property {string} command
 * @property {object} payload
 */

/**
 * Encapsulate WebSocket and provides the endpoint, filtering stream and authentification status.
 * It also handles session token by adding it in the handshake request
 * from sessionService transparently for developer. Authentification is done when `authed` event
 * is emitted.
 *
 * @extends EventEmitter
 *
 * @fires WebSocketClient#open
 * @fires WebSocketClient#error
 * @fires WebSocketClient#close
 * @fires WebSocketClient#message
 * @fires WebSocketClient#authed
 * @fires WebSocketClient#token
 * @fires WebSocketClient#command
 *
 * @property {boolean} authed - If server authed connexion and commands can be made
 *
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 * @author Vladimir Kosmala <vladimir.kosmala@cern.ch>
 * @example
 * import {WebSocketClient} from '/js/src/index.js';
 * const ws = new WebSocketClient();
 * ws.addListener('authed', () => {
 *   console.log('ready, lets send a message');
 *   ws.sendMessage({command: 'custom-client-event-name', payload: 123});
 * });
 * ws.addListener('command', (message) => {
 *   if (message.command === 'custom-server-event-name') {
 *     // use message.payload
 *   }
 * });
 */
class WebSocketClient extends EventEmitter {
  /**
   * Create a connection to the server
   */
  constructor() {
    super();

    this.connection = null;
    this.authed = false;

    this._connect();
  }

  /**
   * Private. Create an instance of WebSocket and binds events
   */
  _connect() {
    const session = sessionService.get();
    const url = new URL(location);
    url.protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    url.searchParams.append('token', session.token);

    this.connection = new WebSocket(url);
    this.connection.addEventListener('message', (message) => this._handleMessage(message));
    this.connection.addEventListener('open', () => this.emit('open'));
    this.connection.addEventListener('close', (closeEvent) => this.emit('close', closeEvent));
  }

  /**
   * Private. Handle non-user messages: authentification, token refresh, errors
   * @param {MessageEvent} e - Event message received by websocket
   */
  _handleMessage(e) {
    let parsed;

    try {
      parsed = JSON.parse(e.data);
    } catch {
      throw new Error('unable to parse ws data');
    }

    // Handling authentification success
    if (parsed.command == 'authed') {
      this.authed = true;
      this.emit('authed');
      return;
    }

    // Handling token refresh error
    if (parsed.code == 440) {
      const session = sessionService.get();
      session.token = parsed.payload.newtoken;
      this.emit('token', parsed);
      return;
    }

    // Handling request error
    if (parsed.code >= 400) {
      this.emit('error', parsed);
      return;
    }

    // Fire parsed and valid message to be used by clients
    this.emit('command', parsed);
  }

  /**
   * Send plain object to server, it must implement the Message interface (command field),
   * you must also wait the connection to be authentificated (authed property and event).
   * @param {object} message - Message to be sent to server
   */
  sendMessage(message) {
    if (!this.authed) {
      throw new Error('Client not yet authenticated by the server');
    }
    if (!message.command) {
      throw new Error('message must have a command field');
    }

    const session = sessionService.get();
    message.token = session.token;
    this.connection.send(JSON.stringify(message));
  }

  /**
   * Send the stream filter to server
   * @param {function} filter - Filter function to be sent to server
   */
  setFilter(filter) {
    const message = {
      command: 'filter',
      payload: filter.toString(),
    };
    this.sendMessage(message);
  }
}

export default WebSocketClient;
