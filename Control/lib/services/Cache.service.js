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

const {Log} = require('@aliceo2/web-ui');
const {WebSocketMessage} = require('@aliceo2/web-ui');
const {deepStrictEqual, AssertionError} = require('assert');

/**
 * @class
 * CacheService class is designed to store in-memory information and allow users to also broadcast new information to the all or registered clients.
 */
class CacheService {
  /**
   * @constructor
   * Constructor for initializing the service with:
   * - empty maps for needed information
   * - optional service for broadcasting information
   * @param {WebSocket} wsService - which is to be used for broadcasting
   */
  constructor(wsService) {

    /**
     * @type {Object<String, Object>}
     */
    this._memory = {};

    /**
     * @type {WebSocket}
     */
    this._wsService = wsService;

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/cache-service`);
  }

  /**
   * Method to receive a function for retrieval of information and a key under which the information should be updated 
   * @param {String} key - key under which the information should be stored
   * @param {String} command - command to be used for broadcasting message
   * @param {Function} update - function to be used for retrieving information; Assumed async with no parameters
   */
  async updateByKeyAndBroadcast(key, command = 'message', getUpdate) {
    let updatedInfo = null;
    try {
      updatedInfo = await getUpdate();
    } catch (error) {
      this._logger.debug(`Unable to update key ${key} based on ${getUpdate} due to ${error}`);
      return;
    }

    if (updatedInfo) {
      try {
        deepStrictEqual(updatedInfo, this._memory[key]);
      } catch (error) {
        if (error instanceof AssertionError) {
          this._memory[key] = updatedInfo;

          const message = new WebSocketMessage()
            .setCommand(command)
            .setPayload(updatedInfo);
          this._wsService?.broadcast(message)
        } else {
          this._logger.debug(`Unable to update key ${key} due to ${error}`);
        }
      }
    }
  }

  /**
   * Getter for retrieving a copy of the information stored in-memory under a certain key
   * @param {key} - key under which information is stored
   * @return {Object}
   */
  getByKey(key) {
    if (this._memory[key]) {
      return JSON.parse(JSON.stringify(this._memory[key]));
    }
    return null;
  }
}

module.exports = {CacheService};
