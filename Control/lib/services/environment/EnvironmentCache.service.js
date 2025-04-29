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
const { BroadcastKeys: { ENVIRONMENT_EVENTS, ENVIRONMENTS_OVERVIEW } } = require('./../../common/broadcastKeys.enum');
const {
  EmitterKeys: {
    ENVIRONMENTS_TRACK, INTEGRATED_SERVICES_TRACK
  }
} = require('./../../common/emitterKeys.enum.js');
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
    this._lastUpdate = undefined;

    this._broadcastService = broadcastService;
    this._eventEmitter = eventEmitter;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/env-cache-service`);
    this._listenToEventsAndBroadcast();
  }

  /**
   * Getter for retrieving the environments from cache
   * @returns {Map<string, EnvironmentInfo>} - the environments stored in cache
   */
  get environments() {
    return this._environments;
  }

  /**
   * Update an environment in the cache by its id
   * @param {string} id - the id of the environment to be updated
   * @param {EnvironmentInfo} environment - the new environment information to be set
   * @returns {void}
   */
  addOrUpdateEnvironment(environment, shouldBroadcast = false) {
    const { id } = environment;
    if (this._environments.has(id)) {
      const cachedEnvironment = this._environments.get(id);
      const { events = [] } = cachedEnvironment;
      const updatedEnvironment = Object.assign({}, cachedEnvironment, environment);
      updatedEnvironment.events = [...events];
      this._environments.set(id, updatedEnvironment);
    } else {
      this._environments.set(id, { ...environment, events: environment.events ?? [] });
    }
    if (shouldBroadcast) {
      this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, [...this._environments.values()]);
    }
    this._lastUpdate = Date.now();
  }

  /**
   * Method should receive an environment id and an attribute path and its value to be updated
   * Given this information, the method should update the environment in the cache
   * @param {string} id - the id of the environment to be updated
   * @param {string} attributePath - the attribute path to be updated in the form of "key1.key2.key3"
   * @param {string} value - the new value to be set
   * @returns {void}
   */
  _updateAttributeOfEnvironment(id, attributePath, value) {
    if (this._environments.has(id)) {
      const cachedEnvironment = JSON.parse(JSON.stringify(this._environments.get(id)));
      let current = cachedEnvironment;
      const keys = attributePath.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;

      this._environments.set(id, cachedEnvironment);
      return cachedEnvironment;
    } else {
      this._logger.warnMessage(`Environment with id ${id} not found in cache.`);
      return null;
    }
  }

  /**
   * @private
   * Method to listen to environment events, update the cache accordingly, and broadcast the information to the clients
   * @returns {void}
   */
  _listenToEventsAndBroadcast() {
    this._eventEmitter.on(ENVIRONMENTS_TRACK, (event) => {
      const { timestamp } = event;
      
      const environmentEvent = fromEcsEventToEnvironmentEvent(event);
      environmentEvent.timestamp = this._adaptInt64ToNumber(timestamp);
      const { id } = environmentEvent;

      const cachedEnvironment = this._environments.has(id)
        ? this._environments.get(id)
        : { id, events: [] };

      cachedEnvironment.events.push(environmentEvent);
      cachedEnvironment.lastUpdate = this._adaptInt64ToNumber(timestamp);
      this._environments.set(id, cachedEnvironment);
      this._broadcastService.broadcast(ENVIRONMENT_EVENTS, cachedEnvironment);
      this._lastUpdate = Date.now();
    });

    this._eventEmitter.on(INTEGRATED_SERVICES_TRACK.ODC.ENVIRONMENT_STATE_CHANGE,
      /**
       * @private
       * Event object is as per type returned by fromEcsIntegratedServiceEventToEvent
       * @param {object} event - the event object containing the payload and environmentId
       */
      (event) => {
        const { payload, environmentId } = event;
        const environmentUpdated = this._updateAttributeOfEnvironment(
          environmentId,
          'hardware.epn.info',
          {
            state: payload?.state,
            ddsSessionId: payload?.ddsSessionId,
            ddsSessionStatus: payload?.ddsSessionStatus,
          }
        );
        if (environmentUpdated) {
          this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, [...this._environments.values()]);
        }
      });
  }

  /**
   * @private
   * Method to adapt the int64 timestamp to a number
   * @param {BigInt} int64 - the int64 timestamp to be adapted
   * @return {number} - the adapted timestamp
   */
  _adaptInt64ToNumber(int64) {
    const bigIntTimestamp = BigInt(int64.toString(10));
    return Number(bigIntTimestamp);
  }
}

module.exports = {EnvironmentCacheService};
