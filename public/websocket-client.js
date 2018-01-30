/**
 * WebSocket client class
 * @param {number} id - CERN person id
 * @param {string} token - JWT authentication token
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class WebSocketClient { // eslint-disable-line no-unused-vars
  /**
   * Sets up internal variables
   * @param {number} id - CERN person id
   * @param {string} token - JWT authentication token
   */
  constructor(id, token) {
    this.id = id;
    this.token = token;
    this.url = (location.host.length == 0) ? 'ws://localhost' : `wss://${location.host}`;
    this.authed = false;
    this.callbackArray = [];
    this.connect();
    this.activateOnMessage();
  }

  /**
   * Connects to WebSocket endpoint
   */
  connect() {
    this.connection = new WebSocket(this.url + '?token=' + this.token);
  }

  /**
   * Created onmessage event listener.
   * Handles token refresh procedure
   */
  activateOnMessage() {
    this.connection.onmessage = (evt) => {
      try {
        let parsed = JSON.parse(evt.data);
        if (parsed.command == 'authed') {
          this.authed = true;
        }
        // handling token refresh error
        if (parsed.code == 440) {
          this.token = parsed.payload.newtoken;
        } else if (parsed.code >= 400) {
          throw new Error('Return code ' + parsed.code);
        } else {
          if (this.callbackArray.hasOwnProperty(parsed.command)) {
            const response = this.callbackArray[parsed.command](parsed);
            this.send(response);
          }
        }
      } catch (e) {
        // continue even though message parsing failed
      }
    };
  }

  /**
   * Allows to attach callback to given message name
   * @param {string} name  message name
   * @param {fucntion} callback invoked when the message with given name is received
   */
  bind(name, callback) {
    if (typeof callback !=='function') {
      throw Error('WebSocket callback is not a function.');
    }
    if (this.callbackArray.hasOwnProperty(name)) {
      throw Error('WebSocket callback already exists.');
    }
    this.callbackArray[name] = callback;
  }

  /**
   * Send filter to WebSocket server
   * @param {function} filter
   */
  setFilter(filter) {
    const message = {
      'command': 'filter',
      'filter': filter.toString()
    };
    this.send(message);
  }

  /**
   * Send message to WebSocket server
   * @param {object} message - message to be sent
   */
  send(message) {
    if (!this.authed) {
      throw new Error('Client not yet authenticated by the server');
    }
    message.token = this.token;
    this.connection.send(JSON.stringify(message));
  }

  /**
   * Sets onclose callback
   * @param {function} callback
   */
  onclose(callback) {
    this.connection.onclose = callback;
  }

  /**
   * Sets onopen callaback
   * @param {function} callback
   */
  onopen(callback) {
    this.connection.onopen = callback;
  }

  /** Sets onerror callback
   * @param {function} callback
   */
  onerror(callback) {
    this.connection.onerror = callback;
  }
}
