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
   * @param {BroadcastService} broadcastService - which is to be used for broadcasting
   */
  constructor(broadcastService) {

    /**
     * @type {Object<String, Object>}
     */
    this._memory = {};

    /**
     * @type {BroadcastService}
     */
    this._broadcastService = broadcastService;

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/cache-service`);
  }

  /**
   * Method to receive a function for retrieval of information and a key under which the information should be updated 
   * @param {String} key - key under which the information should be stored
   * @param {String} value - command to be used for broadcasting message
   * @param {Object} broadcastConfig - object containing broadcast information; if present information will be broadcasted
   * @return {void}
   */
  async updateByKeyAndBroadcast(key, value, {command} = {}) {
    if (value) {
      try {
        deepStrictEqual(value, this._memory[key]);
      } catch (error) {
        if (error instanceof AssertionError) {
          this._memory[key] = value;
          if (command) {
            this._broadcastService.broadcast(command, value);
          }
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
