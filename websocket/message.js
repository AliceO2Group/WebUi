/**
 * WebSocket module that allows to create response to user request.
 * It's based on HTTP status codes.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class WebSocketMessage {
  /**
   * Sets initial variables.
   * @param {number} code response code (based on HTTP)
   * @constructor
   */
  constructor(code = 200) {
    this._code = code;
    this._broadcast = false;
    this._payload = {};
    this._command = 'default';
    this._message = '';
  }

  /**
   * Parses JSON-encoded websocket string into WebSocketMessage object
   * @param {string} json
   * @return {object} promise to parsed message
   */
  parse(json) {
    return new Promise((resolve, reject) => {
      const parsed = JSON.parse(json);
      if ((typeof parsed.command !== 'string') || (typeof parsed.token !== 'string')) {
        this._code(400);
        reject(this);
      }
      this._command = parsed.command;
      this._token = parsed.token;
      delete parsed.command;
      delete parsed.token;
      this._payload = parsed;
      resolve(this);
    });
  }
  /**
   * @return {number} code
   */
  getCode() {
    return this._code;
  }

  /**
   * @return {string} JWT token
   */
  getToken() {
    return this._token;
  }

  /**
   * Command setter.
   * @param {string} command - user request command
   * @return {object} 'this' to allow function call chaining
   */
  setCommand(command) {
    this._command = command;
    return this;
  }

  /**
   * @return {string} command
   */
  getCommand() {
    return this._command;
  }

  /**
   * Set broadcast flag to true.
   * @return {object} 'this' to allow function call chaining
   */
  setBroadcast() {
    this._broadcast = true;
    return this;
  }

  /**
   * @return {bool} broadcast flag
   */
  getBroadcast() {
    return this._broadcast;
  }

  /**
   * Payload setter.
   * @param {object} payload
   * @return {object} 'this' to allow function call chaining
   */
  setPayload(payload) {
    this._payload = payload;
    return this;
  }

  /**
  * @return {object} payload
  */
  getPayload() {
    return this._payload;
  }

  /**
   * Formats the reponse to object that is ready to be formatted into JSON.
   * @return {object} response
   */
  get json() {
    let jsonResponse = {
      code: this._code
    };
    if (this._message != '') {
      jsonResponse.message = this._message;
    }
    if (this._command != undefined) {
      jsonResponse.command = this._command;
    }
    if (Object.keys(this._payload).length > 0) {
      jsonResponse.payload = this._payload;
    }
    return jsonResponse;
  }
}
module.exports = WebSocketMessage;
