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

const {CacheKeys} = require('./../common/cacheKeys.enum.js');
const EnvironmentInfoAdapter = require('./../adapters/EnvironmentInfoAdapter.js');
const {EnvironmentTransitionResultAdapter} = require('./../adapters/EnvironmentTransitionResultAdapter.js');
const {grpcErrorToNativeError} = require('./../errors/grpcErrorToNativeError.js');

/**
 * EnvironmentService class to be used to retrieve data from AliEcs Core via the gRPC Control client
 */
class EnvironmentService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcProxy} coreGrpc 
   * @param {ApricotProxy} apricotGrpc 
   * @param {CacheService} cacheService - to use for updating information on environments
   */
  constructor(coreGrpc, apricotGrpc, cacheService, broadcastService) {
    /**
     * @type {GrpcProxy}
     */
    this._coreGrpc = coreGrpc;

    /**
     * @type {ApricotProxy}
     */
    this._apricotGrpc = apricotGrpc;
    /**
     * @type {CacheService}
     */
    this._cacheService = cacheService;

    /**
     * @type {BroadcastService}
     */
    this._broadcastService = broadcastService;
  }

  /**
   * Given an environment ID, use the gRPC client to retrieve needed information
   * Parses the environment and prepares the information for GUI purposes
   * @param {string} id - environment id as defined by AliECS Core
   * @param {string} taskSource - Source of where to request tasks from: FLP, EPN, QC, TRG
   * @return {EnvironmentDetails}
   * @throws {Error}
   */
  async getEnvironment(id, taskSource) {
    try {
      const {environment} = await this._coreGrpc.GetEnvironment({id});
      const detectorsAll = this._apricotGrpc.detectors ?? [];
      const hostsByDetector = this._apricotGrpc.hostsByDetector ?? {};
      return EnvironmentInfoAdapter.toEntity(environment, taskSource, detectorsAll, hostsByDetector);
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
  }

  /**
   * Given an environment ID and a transition type, use the gRPC client to perform the transition
   * @param {String} id - environment id as defined by AliECS Core
   * @param {EnvironmentTransitionType} transitionType - allowed transitions for an environment
   * @return {EnvironmentTransitionResult} - result of the environment transition
   */
  async transitionEnvironment(id, transitionType) {
    try {
      const transitionedEnvironment = await this._coreGrpc.ControlEnvironment({id, type: transitionType});
      return EnvironmentTransitionResultAdapter.toEntity(transitionedEnvironment);
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
  }

  /**
   * Given the workflowTemplate and variables configuration, it will generate a unique string and send all to AliECS to create a
   * new auto transitioning environment
   * @param {String} workflowTemplate - name in format `repository/revision/template`
   * @param {Object<String, String>} vars - KV string pairs to define environment configuration
   * @param {String} detector - on which the environment is deployed
   * @param {String} runType - for which the environment is deployed
   * @return {AutoEnvironmentDeployment} - if environment request was successfully sent
   */
  async newAutoEnvironment(workflowTemplate, vars, detector, runType) {
    const channelIdString = (Math.floor(Math.random() * (999999 - 100000) + 100000)).toString();
    const autoEnvironment = {
      channelIdString,
      inProgress: true,
      detector,
      runType,
      events: [
        {
          type: 'ENVIRONMENT',
          payload: {
            id: '-',
            message: 'request was sent to AliECS',
            at: Date.now(),
          }
        }
      ],
    };
    let calibrationRunsRequests = this._cacheService.getByKey(CacheKeys.CALIBRATION_RUNS_REQUESTS);
    if (!calibrationRunsRequests) {
      calibrationRunsRequests = {};
    }
    if (!calibrationRunsRequests[detector]) {
      calibrationRunsRequests[detector] = {};
    }
    if (!calibrationRunsRequests[detector[runType]]) {
      calibrationRunsRequests[detector][runType] = autoEnvironment;

    }
    this._cacheService.updateByKeyAndBroadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests);
    this._broadcastService.broadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests[detector][runType]);

    const subscribeChannel = this._coreGrpc.client.Subscribe({id: channelIdString});
    subscribeChannel.on('data', (data) => this._onData(data, channelIdString, detector, runType));
    subscribeChannel.on('error', (error) => this._onError(error, channelIdString, detector, runType));
    subscribeChannel.on('end', () => this._onEnd(channelIdString, detector, runType));


    this._coreGrpc.NewAutoEnvironment({
      vars,
      workflowTemplate,
      id: channelIdString
    });

    return autoEnvironment;
  }

  /**
   * Method to parse incoming messages from stream channel
   * @param {Event} event - AliECS Event (proto)
   * @param {Symbol} id - id of the request that was sent for a new auto environment
   * @return {void}
   */
  _onData(event, id, detector, runType) {
    const events = [];
    const {taskEvent, environmentEvent} = event;

    if (taskEvent && (taskEvent.state === 'ERROR' || taskEvent.status === 'TASK_FAILED')) {
      events.push({
        type: 'TASK',
        payload: {
          ...taskEvent,
          at: Date.now(),
          message: 'Please ensure environment is killed before retrying',
        }
      });
    } else if (environmentEvent) {
      events.push({
        type: 'ENVIRONMENT',
        payload: {
          ...environmentEvent,
          at: Date.now()
        }
      });
    }
    if (events.length > 0) {
      const calibrationRunsRequests = this._cacheService.getByKey(CacheKeys.CALIBRATION_RUNS_REQUESTS);
      calibrationRunsRequests[detector][runType].events.push(...events);
      this._cacheService.updateByKeyAndBroadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests);
      this._broadcastService.broadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests[detector][runType]);
    }
  }

  /**
   * Method to be used in case of AliECS environment creation request error
   * @param {Error} error - error encountered during the creation of environment
   * @param {String} id - id of the environment request in question
   * @return {void}
   */
  _onError(error, id, detector, runType) {
    const calibrationRunsRequests = this._cacheService.getByKey(CacheKeys.CALIBRATION_RUNS_REQUESTS);
    calibrationRunsRequests[detector][runType].events.push({
      type: 'ERROR',
      payload: {
        error,
        at: Date.now()
      }
    });
    calibrationRunsRequests[detector][runType].events.push({
      type: 'ERROR',
      payload: {
        error: 'Please ensure environment is killed before retrying',
        at: Date.now()
      }
    });
    this._cacheService.updateByKeyAndBroadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests);
    this._broadcastService.broadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests[detector][runType]);
  }

  /**
   * Method to be used for when environment successfully finished transitioning
   * @param {String} id - id of the environment request in question
   * @return {void}
   */
  _onEnd(id, detector, runType) {
    const calibrationRunsRequests = this._cacheService.getByKey(CacheKeys.CALIBRATION_RUNS_REQUESTS);
    calibrationRunsRequests[detector][runType].events.push({
      type: 'ENVIRONMENT',
      payload: {
        at: Date.now(),
        message: 'Stream has now ended'
      }
    });
    calibrationRunsRequests[detector][runType].inProgress = false;
    this._cacheService.updateByKeyAndBroadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests);
    this._broadcastService.broadcast(CacheKeys.CALIBRATION_RUNS_REQUESTS, calibrationRunsRequests[detector][runType]);
  }
}

module.exports = {EnvironmentService};
