/**
 * WebSocket client as jQuery UI widget.
 * Required options:
 *  - url - WebSocket server endpoint
 *  - token - JWT authentication token
 *  - id - CERN person id
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
$.widget('o2.websocket', {
  options: {
    id: null,
    token: null,
    url: 'localhost'
  },

  /**
   * Create widget instance 
   */ 
  _create: function() {
    if (this.options.id == null || this.options.token == null) {
      throw new Error(this.widgetFullName + ': Options not set.');
    }
    this._connect();
  },

  /**
   * Connect to Websocket endpoint and specyfies WebSocket event listeners
   */ 
  _connect: function() {
    this.options.connection = new WebSocket(this.options.url + '?token=' + this.options.token);

    this.options.connection.onopen = () => {
      this._trigger('open', null, null);
    };

    this.options.connection.onerror = (err) => {
      throw new Error(this.widgetFullName + ': Connection failed.');
    };

    this.options.connection.onmessage = (evt) => {
      $((~evt.data.indexOf('testmessage')) ? '#messages' : '#console').append(evt.data + '\n');
      try {
        let parsed = $.parseJSON(evt.data);
        // handling token refresh error
        if (parsed.code == 440) {
          this.options.token = parsed.payload.newtoken;
        } else if (parsed.code >= 400) {
          throw new Error(this.widgetFullName + ': Return code ' + parsed.code);
        } else {
          this._trigger(parsed.command, evt, parsed);
        }
      } catch (e) {
        // continue even though message parsing failed
      }
    };

    this.options.connection.onclose = (code) => {
      this._trigger('close', null, null);
    };
  },

  /**
   * Send message to WebSocket server
   * @param {object} message - message to be sent
   */ 
  send: function(message) {
    message.token = this.options.token;
    this.options.connection.send(JSON.stringify(message));
  }
});
