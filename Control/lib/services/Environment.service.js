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

const {LogManager,grpcErrorToNativeError, NotFoundError} = require('@aliceo2/web-ui');
const { CacheKeys } = require('./../common/cacheKeys.enum.js');
const { BroadcastKeys: { ENVIRONMENTS_OVERVIEW } } = require('./../common/broadcastKeys.enum');
const EnvironmentInfoAdapter = require('./../adapters/EnvironmentInfoAdapter.js');
const {EnvironmentTransitionResultAdapter} = require('./../adapters/EnvironmentTransitionResultAdapter.js');

/**
 * EnvironmentService class to be used to retrieve data from AliEcs Core via the gRPC Control client
 */
class EnvironmentService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcServiceClient} coreGrpc 
   * @param {ApricotProxy} apricotGrpc 
   * @param {CacheService} cacheService - to use for updating information on environments
   * @param {BroadcastService} broadcastService - to use for broadcasting information
   * @param {EnvironmentCacheService} environmentCacheService - to use for caching environments
   */
  constructor(coreGrpc, apricotGrpc, cacheService, broadcastService, environmentCacheService) {
    /**
     * @type {GrpcServiceClient}
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

    /**
     * @type {EnvironmentCacheService}
     */
    this._environmentCacheService = environmentCacheService;
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/env-service`);
  }

  /**
   * Method to retrieve all environments from AliECS Core via the gRPC Client and update the Cache
   * @param {boolean} showTaskInfos - if true, will retrieve task information for each environment
   * @param {boolean} shouldUpdateCache - if true, will update the cache with the retrieved environments
   * @return {Promise.<EnvironmentInfo[], Error>} - if operation was a success or not
   */
  async getEnvironments(showTaskInfos = false, shouldUpdateCache = false) {
    let environments = [];
    try {
      ({ environments } = await this._coreGrpc.GetEnvironments({ showTaskInfos }));
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
    try { 
      if (!environments || environments.length === 0) {
        this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, []);
        return [];
      }
      const environmentList = [];
      const cachedEnvironmentIds = [...this._environmentCacheService.environments.keys()];
      for (const { id } of environments) {
        let environment;
        try {
          // Retrieving environments one by one is needed so that ODC devices tasks info is part of the payload
          // Issue reported: OCTRL-1012
          environment = await this.getEnvironment(id, '', false);
        } catch (error) {
          this._logger.error(`Failed to retrieve environment ${id}: ${error}`);
        }
        if (environment) {
          if (shouldUpdateCache) {
            this._environmentCacheService.addOrUpdateEnvironment(environment, false);
          }
          environmentList.push(environment);
        }
       
      }
      // Remove environments from cache that are not in the retrieved list
      for (const cachedEnvironmentId of cachedEnvironmentIds) {
        if (!environmentList.some(env => env.id === cachedEnvironmentId)) {
          this._environmentCacheService.environments.delete(cachedEnvironmentId);
        }
      }
      this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, [...this._environmentCacheService.environments.values()]);
      return environmentList;
    } catch (error) {
      console.log(error);
      this._logger.errorMessage(error);
    }
  }

  /**
   * Given an environment ID, use the gRPC client to retrieve needed information
   * Parses the environment and prepares the information for GUI purposes
   * @param {string} id - environment id as defined by AliECS Core
   * @param {string} taskSource - Source of where to request tasks from: FLP, EPN, QC, TRG
   * @return {EnvironmentInfo}
   * @throws {Error}
   */
  async getEnvironment(id, taskSource, retrieveEvents = true) {
    let environment = undefined;
    try {
      const environmentResponse = await this._coreGrpc.GetEnvironment({ id });
      environment = environmentResponse.environment ?? undefined;
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
    if (!environment) { 
      throw new NotFoundError(`Environment (id: ${id}) not found`);
    }
    const detectorsAll = this._apricotGrpc.detectors ?? [];
    const hostsByDetector = this._apricotGrpc.hostsByDetector ?? {};
    const environmentInfo = EnvironmentInfoAdapter.toEntity(
      environment, taskSource, detectorsAll, hostsByDetector
    );
    if (retrieveEvents && this._environmentCacheService.environments.has(id)) {
      const cachedEnvironment = this._environmentCacheService.environments.get(id);
      environmentInfo.events = [...cachedEnvironment.events];
    } 
    return environmentInfo;
  }

  /**
   * Given an environment ID and a transition type, use the gRPC client to perform the transition
   * @param {String} id - environment id as defined by AliECS Core
   * @param {EnvironmentTransitionType} transitionType - allowed transitions for an environment
   * @param {User} requestUser - user that requested the transition
   * @return {EnvironmentTransitionResult} - result of the environment transition
   */
  async transitionEnvironment(id, transitionType, user) {
    try {
      const transitionedEnvironment = await this._coreGrpc.ControlEnvironment({
        id, type: transitionType, requestUser: user.toEcsFormat()
      });
      return EnvironmentTransitionResultAdapter.toEntity(transitionedEnvironment);
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
  }

  /**
   * Given an environment ID and optional parameters, use the gRPC client to send a request to destroy an environment
   * @param {String} id - environment id as defined by AliECS Core
   * @param {{keepTasks: Boolean, allowInRunningState: Boolean, force: Boolean}} - options for destroying the environment
   * @return {Promise.<{String}, Error>} - if operation was a success or not
   */
  async destroyEnvironment(id, {keepTasks = false, allowInRunningState = false, force = false} = {}, user) {
    try {
      await this._coreGrpc.DestroyEnvironment({
        id, keepTasks, allowInRunningState, force, requestUser: user.toEcsFormat()
      });
      return {id};
    } catch (grpcError) {
      throw grpcErrorToNativeError(grpcError);
    }
  }

  /**
   * @param {String} workflowTemplate - name in format `repository/revision/template`
   * @param {Object<String, String>} userVars - KV string pairs to define environment configuration
   * @param {boolean} autoTransition - if true, will automatically transition the environment to the requested state
   * @param {User} user - user that requested the environment creation
   * @return {Promise.<{PartialEnvironmentInfo}, Error>} - if operation was a success or not
   */
  async newEnvironmentAsync({
    workflowTemplate,
    userVars,
    autoTransition = false,
    user = undefined }
  ) {
    let environmentResponse = undefined;
    try {
      environmentResponse = await this._coreGrpc.NewEnvironmentAsync({
        workflowTemplate,
        vars: userVars,
        autoTransition,
        requestUser: user
      });
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }

    try {
      const { environment } = environmentResponse;
      const detectorsAll = this._apricotGrpc.detectors ?? [];
      const hostsByDetector = this._apricotGrpc.hostsByDetector ?? {};
    
      const environmentInfo = EnvironmentInfoAdapter.toEntity(environment, '', detectorsAll, hostsByDetector);
      this._environmentCacheService.addOrUpdateEnvironment(environmentInfo, true);
      return environmentInfo;
    } catch (error) {
      throw new Error(`Unable to process environment from NewEnvironmentAsync response from ECS ${error}`);
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
  async newAutoEnvironment(workflowTemplate, vars, detector, runType, user) {
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
    subscribeChannel.on('data', (data) => this._onData(data, detector, runType));
    subscribeChannel.on('error', (error) => this._onError(error, detector, runType));
    subscribeChannel.on('end', () => this._onEnd(detector, runType));


    this._coreGrpc.NewAutoEnvironment({
      vars,
      workflowTemplate,
      id: channelIdString,
      requestUser: user.toEcsFormat()
    });

    return autoEnvironment;
  }

  /**
   * Method to parse incoming messages from stream channel
   * @param {Event} event - AliECS Event (proto)
   * @param {String} detector - detector name for which the event was triggered
   * @param {String} runType - run type for which the event was triggered
   * @return {void}
   */
  _onData(event, detector, runType) {
    const events = [];
    const {taskEvent, environmentEvent, timestamp = Date.now()} = event;
    if (taskEvent && (taskEvent.state === 'ERROR' || taskEvent.status === 'TASK_FAILED')) {
      events.push({
        type: 'TASK',
        payload: {
          ...taskEvent,
          at: Number(timestamp),
          message: 'Please ensure environment is killed before retrying',
        }
      });
    } else if (environmentEvent) {
      events.push({
        type: 'ENVIRONMENT',
        payload: {
          ...environmentEvent,
          at: Number(timestamp),
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
   * @param {String} detector - detector name for which the event was triggered
   * @param {String} runType - run type for which the event was triggered
   * @return {void}
   */
  _onError(error, detector, runType) {
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
   * @param {String} detector - detector name for which the event was triggered
   * @param {String} runType - run type for which the event was triggered
   * @return {void}
   */
  _onEnd(detector, runType) {
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
