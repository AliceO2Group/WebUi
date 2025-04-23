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

const { LogManager } = require('@aliceo2/web-ui');
const { BroadcastKeys: { ENVIRONMENTS } } = require('./../../common/broadcastKeys.enum');
const { EmitterKeys: { ENVIRONMENTS_TRACK } } = require('./../../common/emitterKeys.enum.js');
const { fromEcsEventToEnvironmentEvent } = require('./../../kafka/adapters/fromEcsEventToEnvironmentEvent.js');

/**
 * @class
 * EnvironmentCacheService class is designed to store in-memory information and allow users to also broadcast new information to the all or registered clients.
 */
class EnvironmentCacheService {
  /**
   * Constructor for initializing the service with:
   * - empty maps for needed information
   * - optional service for broadcasting information
   * @param {BroadcastService} broadcastService - which is to be used for broadcasting
   * @param {EventEmitter} eventEmitter - which is to be used for listening to events
   */
  constructor(broadcastService, eventEmitter) {
    this._environments = new Map();

    this._broadcastService = broadcastService;
    this._eventEmitter = eventEmitter;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/env-cache-service`);
    this._listenToEventsAndBroadcast();
  }

  /**
   * @private
   * Method to listen to environment events, update the cache accordingly, and broadcast the information to the clients
   * @returns {void}
   */
  _listenToEventsAndBroadcast() {
    this._eventEmitter.on(ENVIRONMENTS_TRACK, (environment) => {
      try {
        const { id, timestamp } = environment;
        if (!id) {
          throw new Error('Missing id');
        }
        const cachedEnvironment = this._environments.has(id)
          ? this._environments.get(id)
          : { id, events: [] };

        cachedEnvironment.events.push(fromEcsEventToEnvironmentEvent(environment));
        cachedEnvironment.lastUpdate = timestamp;

        this._environments.set(id, cachedEnvironment);
        this._broadcastService.broadcast(ENVIRONMENTS, cachedEnvironment);
      } catch (error) {
        this._logger.errorMessage(`Error while processing environment event: ${error}`);
      }
    });
  }
}

module.exports = {EnvironmentCacheService};
