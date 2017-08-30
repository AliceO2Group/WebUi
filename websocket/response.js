/**
 * WebSocket module that allows to create response to user request.
 * It's based on HTTP status codes.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class Response {
  /**
   * Sets initial variables.
   * @param {number} code response code (based on HTTP)
   * @constructor
   */
  constructor(code) {
    this._code = code;
    this._broadcast = false;
    this._payload = {};
    this._command = undefined;
  }

  /**
   * Provides HTTP message based on code.
   * @param {number} code
   * @return {string} message for given code
   */
  _message(code) {
    const messages = {
      101: 'Switching Protocols',
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No content',
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      440: 'Login timeout'
    };
    return messages[code];
  }

  /**
   * @return {number} code
   */
  get getcode() {
    return this._code;
  }

  /**
   * Command setter.
   * @param {string} command - user request command
   * @return {object} 'this' to allow function call chaining
   */
  command(command) {
    this._command = command;
    return this;
  }

  /**
   * @return {string} command
   */
  get getcommand() {
    return this._command;
  }

  /**
   * Set broadcast flag to true.
   * @return {object} 'this' to allow function call chaining
   */
  broadcast() {
    this._broadcast = true;
    return this;
  }

  /**
   * @return {bool} broadcast flag
   */
  get getbroadcast() {
    return this._broadcast;
  }

  /**
   * Payload setter.
   * @param {object} payload
   * @return {object} 'this' to allow function call chaining
   */
  payload(payload) {
    this._payload = payload;
    return this;
  }

  /**
  * @return {object} payload
  */
  get getpayload() {
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
    const message = this._message(this._code);
    if (message != undefined) {
      jsonResponse.message = message;
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
module.exports = Response;
