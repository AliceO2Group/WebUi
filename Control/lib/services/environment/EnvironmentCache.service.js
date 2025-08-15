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
const { BroadcastKeys: {
  ENVIRONMENT_EVENTS, ENVIRONMENTS_OVERVIEW, NOTIFICATION
} } = require('./../../common/broadcastKeys.enum');
const {
  EmitterKeys: {
    ENVIRONMENTS_TRACK, INTEGRATED_SERVICES_TRACK, TASKS_TRACK
  }
} = require('./../../common/emitterKeys.enum.js');
const { EnvironmentState } = require('../../common/environmentState.enum.js');
const { TaskState } = require('../../common/taskState.enum.js');
const EPN_PATH_IN_ENVIRONMENT_INFO = 'hardware.epn.info';

const ECS_TRANSITION_DONE_MESSAGE = 'transition completed successfully';

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
   * Method to remove an environment from the cache by its id
   * @param {string} id - the id of the environment to be removed
   * @returns {void}
   */
  removeEnvironmentById(id, shouldBroadcast = true) {
    if (this._environments.has(id)) {
      this._environments.delete(id);
      if (shouldBroadcast) {
        this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, [...this._environments.values()]);
      }
      this._lastUpdate = Date.now();
    }
  }

  /**
   * Update an environment in the cache by its id. This method can be used by either
   * * ECS GUI results of a transition - which should contain `isDeploying` and `deploymentError` properties
   * * Heartbeat calls (GetEnvironment/GetEnvironments) - which will NOT contain `isDeploying` and `deploymentError` properties
   * * Cache caught events - which should contain `isDeploying` and `deploymentError` properties
   * @param {string} id - the id of the environment to be updated
   * @param {EnvironmentInfo} environment - the new environment information to be set
   * @returns {void}
   */
  addOrUpdateEnvironment(environment, shouldBroadcast = false) {
    const { id } = environment;
    if (this._environments.has(id)) {
      const cachedEnvironment = this._environments.get(id);
      const { events = [] } = cachedEnvironment;
      const {isDeploying, deploymentError } = cachedEnvironment;
      const updatedEnvironment = Object.assign({}, cachedEnvironment, environment);
      updatedEnvironment.events = [...events];
      updatedEnvironment.isDeploying = isDeploying;
      updatedEnvironment.deploymentError = deploymentError;
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
    /**
     * @param {EnvironmentEvent} environmentEvent - the event object containing the payload and environmentId
     */
    this._eventEmitter.on(ENVIRONMENTS_TRACK, this._handleEnvironmentEvent.bind(this));

    this._eventEmitter.on(INTEGRATED_SERVICES_TRACK.ODC.ENVIRONMENT_STATE_CHANGE,
      /**
       * @private
       * Event object is as per type returned by fromEcsIntegratedServiceEventToEvent
       * @param {object} event - the event object containing the payload and environmentId
       */
      (event) => {
        const { payload: { state, ddsSessionId, ddsSessionStatus }, environmentId } = event;
        const environmentUpdated = this._updateAttributeOfEnvironment(
          environmentId,
          EPN_PATH_IN_ENVIRONMENT_INFO,
          { state, ddsSessionId, ddsSessionStatus }
        );
        if (environmentUpdated) {
          this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, [...this._environments.values()]);
        }
      });
    
    this._eventEmitter.on(TASKS_TRACK,
      /**
       * @private
       * An event handler for receiving a task event update, parse it as per GUI expectations and broadcast it to NodeJS EventEmitter listeners
       * @param {object} event - the event object containing the payload and environmentId
       * @param {TaskEvent} event.taskEvent - the task event object containing the task information
       * @param {number} event.timestamp - the timestamp of the event
       * @returns {void}
       */
      ({ taskEvent }) => this._handleFirstTaskInError(taskEvent.environmentId, taskEvent)
    );
    
    this._eventEmitter.on(INTEGRATED_SERVICES_TRACK.ODC.DEVICE_STATE_CHANGE,
      /**
       * @private
       * An event handler for receiving an integrated service task state change, parse it as per GUI expectations and broadcast it to NodeJS EventEmitter listeners
       * @param {OdcDeviceInfoEvent} odcDeviceInfoEvent - the task event object containing the task information
       * @returns {void}
       */
      (odcDeviceEvent) => this._handleFirstTaskInError(odcDeviceEvent.environmentId, odcDeviceEvent)
    );
  }
  
  /**
   * Handles the events emitted to tracks TASKS_TRACKS and INTEGRATED_SERVICES_TRACK.ODC.DEVICE_STATE_CHANGE, that is
   * FLP tasks or ODC device state changes.
   * This method checks if the event is in an error state and if it is the first task in error for the environment. 
   * @private
   * @param {string} environmentId - the id of the environment to check if it already has a first task in error
   * @param {TaskEvent|OdcDeviceInfoEvent} event - the task event object containing the task information
   * @return {void}
   */
  _handleFirstTaskInError(environmentId, event) {
    if (
      (event.state === TaskState.ERROR || event.state === TaskState.ERROR_CRITICAL)
      && this._environments.has(environmentId)
      && !this._environments.get(environmentId).firstTaskInError
    ) {
      const environment = JSON.parse(JSON.stringify(this._environments.get(environmentId)));
      environment.firstTaskInError = event;
      this._environments.set(environmentId, environment);
      this._broadcastService.broadcast(NOTIFICATION, event);
    }
  }

  /**
   * Handles the environment event by:
   * * updating the cache with interested changes
   * * broadcasting the event information
   * It does not:
   * * broadcast the overview of environments 
   * @private
   * @param {EnvironmentEvent} environmentEvent - the event object containing the payload and environmentId
   * @returns {void}
   */
  _handleEnvironmentEvent(environmentEvent) {
    const { id, state, transition, message, error, runNumber } = environmentEvent;
    const cachedEnvironment = this._environments.has(id)
      ? this._environments.get(id)
      : { id, events: [] };

    if (state === EnvironmentState.PENDING) {
      // If the environment is pending, we set isDeploying to true as it is the first event we receive for this environment
      // and we want to ensure that the UI is updated accordingly.
      cachedEnvironment.isDeploying = true;
    }
    if (cachedEnvironment.isDeploying && error) {
      // If the environment is deploying and there is an error, environment will not be active in ECS anymore but
      // we still want to keep the information in the cache until a user acknowledges the error
      cachedEnvironment.isDeploying = false;
      cachedEnvironment.deploymentError = error;
    }
   
    if (
      state === EnvironmentState.CONFIGURED &&
      message === ECS_TRANSITION_DONE_MESSAGE
      // OCTRL-1038 - currently comparing to hardcoded string, but this should be replaced with transition status
    ) {
      // Once the environment is configured and ongoing transition is done, we can set the isDeploying to false
      // This can happen when the environment also goes form RUNNING to CONFIGURED but it is already marked as not deploying anymore
      cachedEnvironment.isDeploying = false;
    }
    cachedEnvironment.state = state;
    cachedEnvironment.currentTransition = transition.name;
    cachedEnvironment.currentRunNumber = runNumber;
    cachedEnvironment.events.push(environmentEvent);
    cachedEnvironment.lastUpdate = environmentEvent.timestamp;
    this._environments.set(id, cachedEnvironment);

    this._broadcastService.broadcast(ENVIRONMENT_EVENTS, cachedEnvironment);
    this._lastUpdate = Date.now();
  }
}

module.exports = {EnvironmentCacheService};
