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
 * Controller for dealing with all API requests on framework information such as:
 * - GUI information (status, host, port)
 * - AliECS information
 * - AliECS Integrated Services information
 * - AliECS Apricot
 * - Consul
 * - Grafana
 */
class WebSocketController {
  /**
   * @param {WebSocket} - object to be used to send messages to clients
   */
  constructor(ws) {
    this._ws = ws;

    this._intervals = [];
  }

  /**
   * Adds a new interval to the current list to be executed every {timeout} seconds
   * @param {Function} method - to retrieve information in JSON format
   * @param {number} timeout - (ms) interval on each the provided function should be called
   * @returns {undefined}
   */
  addIntervalForBroadcast(method, timeout = 2500) {
    if (this._ws) {
      const interval = setInterval(() => {
        const payload = JSON.parse(JSON.stringify(Object.fromEntries(method)));
        const message = new WebSocketMessage()
          .setCommand('components-status')
          .setPayload(payload);

        this._ws.broadcast(message);
      }, timeout);
      this._intervals.push(interval);
    }
  }
}

exports.WebSocketController = WebSocketController;
