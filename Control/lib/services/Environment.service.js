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
  constructor(coreGrpc, apricotGrpc, cacheService) {
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
    this._cacheService = cacheService
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
    const {environment} = await this._coreGrpc.GetEnvironment({id});
    const detectorsAll = this._apricotGrpc.detectors ?? [];
    const hostsByDetector = this._apricotGrpc.hostsByDetector ?? {};
    const environmentInfo = EnvironmentInfoAdapter.toEntity(environment, taskSource, detectorsAll, hostsByDetector);

    return environmentInfo;
  }

  /**
   * Given the workflowTemplate and variables configuration, it will generate a unique string and send all to AliECS to create a
   * new auto transitioning environment
   * @param {String} workflowTemplate - name in format `repository/revision/template`
   * @param {Object<String, String>} vars - KV string pairs to define environment configuration
   * @return {String} - if environment request was successfully sent
   */
  async newAutoEnvironment(workflowTemplate, vars) {
    const channelIdString = (Math.floor(Math.random() * (999999 - 100000) + 100000)).toString();

    let environmentRequests = this._cacheService.getByKey(CacheKeys.ENVIRONMENT_REQUESTS);
    if (!environmentRequests) {
      environmentRequests = {};
    }
    if (!environmentRequests[channelIdString]) {
      environmentRequests[channelIdString] = {
        channelIdString,
        events: [],
      };
    }
    this._cacheService.updateByKeyAndBroadcast(
      CacheKeys.ENVIRONMENT_REQUESTS,
      environmentRequests,
    );
    const subscribeChannel = this._coreGrpc.client.Subscribe({id: channelIdString});
    subscribeChannel.on('data', (data) => this._onData(data, channelIdString));
    subscribeChannel.on('error', (error) => this._onError(error, channelIdString));
    subscribeChannel.on('end', () => this._onEnd(channelIdString));


    await this._coreGrpc.NewAutoEnvironment({
      vars,
      workflowTemplate,
      id: channelIdString
    });

    return channelIdString;
  }

  /**
     * Method to parse incoming messages from stream channel
     * @param {Event} event - AliECS Event (proto)
     * @param {Symbol} id - id of the request that was sent for a new auto environment
     * @return {void}
     */
  _onData(event, id) {
    const events = [];
    const {taskEvent, environmentEvent} = event;

    if (taskEvent && taskEvent.status === 'TASK_FAILED') {
      environmentRequests[id].events.push({
        type: 'TASK',
        payload: {
          ...taskEvent
        }
      });
    } else if (environmentEvent) {
      environmentRequests[id].events.push({
        type: 'ENVIRONMENT',
        payload: {
          ...environmentEvent
        }
      });
    }
    const environmentRequests = this._cacheService.getByKey(CacheKeys.ENVIRONMENT_REQUESTS);
    environmentRequests[id].events = events;

    this._cacheService.updateByKeyAndBroadcast(
      CacheKeys.ENVIRONMENT_REQUESTS,
      environmentRequests,
      {command: CacheKeys.ENVIRONMENT_REQUESTS}
    );
  }

  /**
     * Method to be used in case of AliECS environment creation request error
     * @param {Error} error - error encountered during the creation of environment
     * @param {String} id - id of the environment request in question
     * @return {void}
     */
  _onError(error, id) {
    const environmentRequests = this._cacheService.getByKey(CacheKeys.ENVIRONMENT_REQUESTS);
    environmentRequests[id].events.push({
      type: 'ERROR',
      payload: {
        error
      }
    });
    this._cacheService.updateByKeyAndBroadcast(
      CacheKeys.ENVIRONMENT_REQUESTS,
      environmentRequests,
      {command: CacheKeys.ENVIRONMENT_REQUESTS}
    )
  }

  /**
   * Method to be used for when environment successfully finished transitioning
   * @param {String} id - id of the environment request in question
   * @return {void}
   */
  _onEnd(id) {
    const environmentRequests = this._cacheService.getByKey(CacheKeys.ENVIRONMENT_REQUESTS);
    environmentRequests[id].events.push({
      type: 'END',
      payload: {
        message: 'Stream has now ended'
      }
    });
    this._cacheService.updateByKeyAndBroadcast(
      CacheKeys.ENVIRONMENT_REQUESTS,
      environmentRequests,
      {command: CacheKeys.ENVIRONMENT_REQUESTS}
    );
  }
}

module.exports = {EnvironmentService};
