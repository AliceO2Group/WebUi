/* global: window */

import sessionService from './sessionService.js';
import EventTarget from './EventTarget.js';

const location = window.location;

/**
 * Encapsulate WebSocket and provides the endpoint, filtering stream and authentification status.
 * Events:
 * - open
 * - error
 * - close
 * - authed
 * - token
 * - *command*
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 * @author Vladimir Kosmala <vladimir.kosmala@cern.ch>
 */
export default class WebSocketClient extends EventTarget {
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
    url.protocol = 'wss';
    url.searchParams.append('token', session.token);

    this.connection = new WebSocket(url);
    this.connection.addEventListener('message', (...args) => this._handleProtocolMessages(...args));
    this.connection.addEventListener('open', (...args) => this.dispatchEvent(...args));
    this.connection.addEventListener('error', (...args) => this.dispatchEvent(...args));
    this.connection.addEventListener('close', (...args) => this.dispatchEvent(...args));
  }

  /**
   * Private. Handle non-user messages: authentification, token refresh, errors
   * @param {event} e - Event message received by websocket
   */
  _handleProtocolMessages(e) {
    let parsed;

    try {
      parsed = JSON.parse(e.data);
    } catch (e) {
      throw new Error(`unable to parse ws data`);
    }

    // handling authentification success
    if (parsed.command == 'authed') {
      this.authed = true;
      this.dispatchEvent(new Event('authed', parsed));
      return;
    }

    // handling token refresh error
    if (parsed.code == 440) {
      const session = sessionService.get();
      session.token = parsed.payload.newtoken;
      this.dispatchEvent(new Event('token', parsed));
      return;
    }

    // handling request error
    if (parsed.code >= 400) {
      throw new Error(`ws returned error ${parsed.code}`);
    }

    // fire parsed and valid message to be used by clients
    this.dispatchEvent(new Event(parsed.command, parsed));
  }

  /**
   * Send plain object to server, it must implement the Message interface (command field),
   * you must also wait the connection to be authentificated (authed property and event).
   * @param {object} message
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
   * @param {function} filter
   */
  setFilter(filter) {
    const message = {
      command: 'filter',
      filter: filter.toString()
    };
    this.sendMessage(message);
  }
}
