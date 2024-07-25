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
const { WebSocketMessage } = require('@aliceo2/web-ui');
const { deepStrictEqual } = require('assert');
const { SERVICES } = require('../common/constants.js');

/**
 * Service for dealing with broadcasting information about the on framework such as:
 * - GUI information (status, host, port)
 * - AliECS information
 * - AliECS Integrated Services information
 * - AliECS Apricot
 * - Consul
 * - Grafana
 */
class WebSocketService {
  /**
   * @param {WebSocket} ws - object to be used to send messages to clients
   */
  constructor(ws) {
    this._ws = ws;

    this._intervals = [];

    this._servicesDataMap = new Map();
  }

  /**
   * Method to receive updates with regards to the AliECS GUI services; If the update is different than the one sent last time,
   * then a broadcast message will be sent
   * @param {SERVICES} serviceKey - refers to service which is updating data
   * @param {string} key - component from service that receives an update
   * @param {Map<string, object>} value - JSON representation of the status
   */
  updateData(serviceKey, key, value) {
    if (Object.keys(SERVICES).includes(serviceKey)) {
      const component = this._servicesDataMap.get(serviceKey) ?? new Map();
      try {
        const currentValue = component.get(key);
        deepStrictEqual(currentValue, value);
      } catch (error) {
        // if different, broadcast result
        component.set(key, value);
        this._servicesDataMap.set(serviceKey, component);

        const payload = JSON.parse(JSON.stringify(Object.fromEntries(component)));
        const message = new WebSocketMessage()
          .setCommand(`components-${serviceKey}`)
          .setPayload(payload);

        this._ws.broadcast(message);
      }
    }
  }
}

exports.WebSocketService = WebSocketService;
