/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

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
    this._command = null;
    this._message = null;
  }

  /**
   * Parses JSON-encoded websocket string into WebSocketMessage object
   * @param {string} json
   * @return {object} promise to parsed message
   */
  parse(json) {
    return new Promise((resolve, reject) => {
      const parsed = JSON.parse(json);
      if ((typeof parsed.command !== 'string')
        || (typeof parsed.token !== 'string')
        || (parsed.command == '')) {
        this._code = 400;
        this._command = 'error';
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(this);
        return;
      }
      this._command = parsed.command;
      this._token = parsed.token;
      this._payload = parsed.payload;
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
   * @return {number} code
   */
  get code() {
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
   * Command setter.
   * @param {string} command - user request command
   */
  set command(command) {
    this._command = command;
  }

  /**
   * @param {string} name property name
   * @return {string} Object property
   */
  getProperty(name) {
    if (this._payload.hasOwnProperty(name)) {
      return this._payload[name];
    }
  }

  /**
   * @return {string} command
   */
  getCommand() {
    return this._command;
  }

  /**
   * @return {string} command
   */
  get command() {
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
   * Payload setter.
   * @param {object} payload
   */
  set payload(payload) {
    this._payload = payload;
  }

  /**
  * @return {object} payload
  */
  getPayload() {
    return this._payload;
  }

  /**
  * @return {object} payload
  */
  get payload() {
    return this._payload;
  }

  /**
   * Formats the reponse to object that is ready to be formatted into JSON.
   * @return {object} response
   */
  get json() {
    const jsonResponse = {
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
