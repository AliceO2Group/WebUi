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
      const activeEnvironmentList = [];
      for (const { id } of environments) {
        let environment;
        try {
          // Retrieving environments one by one is needed so that ODC devices tasks info is part of the payload
          environment = await this.getEnvironment(id, '', false);
        } catch (error) {
          this._logger.errorMessage(`Failed to retrieve environment ${id}: ${error}`);
        }
        if (environment) {
          if (shouldUpdateCache) {
            this._environmentCacheService.addOrUpdateEnvironment(environment, false);
          }
          activeEnvironmentList.push(environment);
        }
      }
      // Remove environments from cache that are not in the retrieved list and that are not in deploying state
      // Environments that are `isDeploying` should not be removed. If deployment failed, ECS will delete it
      // but we need to keep it until user acknowledges the failure
      // and removes it from the cache manually
      const cachedEnvironmentIds = [...this._environmentCacheService.environments.keys()];
      for (const cachedEnvironmentId of cachedEnvironmentIds) {
        if (!activeEnvironmentList.some((env) => env.id === cachedEnvironmentId)) {
          const environmentPotentiallyToRemove = this._environmentCacheService.environments.get(cachedEnvironmentId);
          if (environmentPotentiallyToRemove.isDeploying || environmentPotentiallyToRemove.deploymentError) {
            // If the environment is deploying or has a deployment error, we still consider it active
            // and we do not remove it from the cache
            activeEnvironmentList.push(environmentPotentiallyToRemove);
          } else {
            this._environmentCacheService.removeEnvironmentById(cachedEnvironmentId);
          }
        }
      }
      this._broadcastService.broadcast(ENVIRONMENTS_OVERVIEW, [...this._environmentCacheService.environments.values()]);
      return activeEnvironmentList;
    } catch (error) {
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
      environmentInfo.isDeploying = cachedEnvironment.isDeploying;
      environmentInfo.deploymentError = cachedEnvironment.deploymentError; 
      environmentInfo.firstTaskInError = cachedEnvironment.firstTaskInError;
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
   * Method to create a NewEnvironmentAsync request using the gRPC client. 
   * Service is considered low-level. It is assumed that the caller has already checked the validity of the parameters.
   * @param {NewEnvironmentRequest - o2control.proto} request - partial request object with information needed to create the environment
   * @param {string} request.workflowTemplate - name in format `repository/revision/template`
   * @param {Object<string, string>} request.userVars - KV string pairs to define environment configuration
   * @param {User} request.user - user that requested the environment creation
   * @returns {Promise.<{EnvironmentInfo}, Error>} - if operation was a success ECS will return a partialEnvironmentInfo object
   * @throws {Error} - if the operation failed
   */
  async newEnvironmentAsync({ workflowTemplate, userVars, user, shouldAutoTransition = false, detectors }) {
    let environment = undefined;
    try {
      ({ environment } = await this._coreGrpc.NewEnvironmentAsync({
        workflowTemplate,
        vars: userVars,
        autoTransition: shouldAutoTransition,
        requestUser: user.toEcsFormat()
      })
      );
    } catch (grpcError) {
      throw grpcErrorToNativeError(grpcError);
    }

    const detectorsAll = this._apricotGrpc.detectors ?? [];
    const hostsByDetector = this._apricotGrpc.hostsByDetector ?? {};
    /**
     * Transition is not yet started as per ECS, but we set the state to DEPLOYING to ensure that the UI
     * is updated accordingly. The state will be updated once the environment is created and the transition
     * is finished.
     * @type {EnvironmentInfo}
     * @property {string} currentTransition - the current transition of the environment
     */
    environment.isDeploying = true;
    /**
     * As per ticket OCTRL-1045, ECS is not able to respond with the static information yet. Thus, the GUI
     * should keep track of the user that requested the environment and the detectors included in the deployment
     * to be able to show this information in the UI.
     */
    if (!environment?.userVars?.last_request_user) {
      if (!environment.userVars) {
        environment.userVars = {};
      }
      environment.userVars.last_request_user = {
        externalId: user.personid,
        name: user.username,
      };
    }
    if (!environment.rootRole) {
      environment.rootRole = workflowTemplate;
    }
    if (!environment.includedDetectors || environment.includedDetectors.length === 0) {
      environment.includedDetectors = detectors ?? [];
    }
    const environmentInfo = EnvironmentInfoAdapter.toEntity(environment, '', detectorsAll, hostsByDetector);
    this._environmentCacheService.addOrUpdateEnvironment(environmentInfo, true);
    return environmentInfo;
  }
}

module.exports = {EnvironmentService};
