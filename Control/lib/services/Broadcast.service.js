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

const {WebSocketMessage} = require('@aliceo2/web-ui');

/**
 * @class
 * BroadcastService class is to be used for building a websocket message and broadcasting it via web sockets
 */
class BroadcastService {
  /**
   * @constructor
   * Constructor for initializing the service with AliceO2/websocket service instance to use
   * @param {WebSocket} wsService - which is to be used for broadcasting
   */
  constructor(wsService) {
    /**
     * @type {WebSocket}
     */
    this._wsService = wsService;
  }

  /**
   * Method to receive command and payload to build a WebSocket message and broadcast it to all listening clients
   * @param {String} command - command to be added to websocket message
   * @param {Object} payload - payload to be sent to the clients
   */
  broadcast(command, payload) {
    if (payload) {
      const message = new WebSocketMessage()
        .setCommand(command)
        .setPayload(payload);
      this._wsService?.broadcast(message);
    }
  }
}

module.exports = {BroadcastService};
