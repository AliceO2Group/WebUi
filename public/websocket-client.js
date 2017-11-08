/**
 * WebSocket client as jQuery UI widget.
 * Required options:
 *  - url - WebSocket server endpoint
 *  - token - JWT authentication token
 *  - id - CERN person id
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */

class WebSocketClient {
  constructor(id, token, oauth) {
    this.id = id;
    this.token = token;
    this.oauth = oauth;
    this.url = (location.host.length == 0) ? 'ws://localhost' : `wss://${location.host}`;
    this.authed = false;
    this.connect();
  }

  connect() {
    this.connection = new WebSocket(this.url + '?oauth=' + this.oauth);
  }

  onmessage(callback) {
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
          callback(parsed.command, parsed);
        }   
      } catch (e) {
        // continue even though message parsing failed
      }   
    };
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

  onclose(callback) {
    this.connection.onclose = callback;
  }

  onopen(callback) {
    this.connection.onopen = callback;
  }

  onerror(callback) {
    this.connection.onerror = callback;
  }
}
