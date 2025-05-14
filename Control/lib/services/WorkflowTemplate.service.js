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

const {grpcErrorToNativeError, NotFoundError, LogManager} = require('@aliceo2/web-ui');
const {
  RUNTIME_COMPONENT: { COG, COG_V1 },
  RUNTIME_KEY: { RUN_TYPE_TO_HOST_MAPPING, WORKFLOW_MAPPINGS },
} = require('./../common/kvStore/runtime.enum.js');

const LOG_FACILITY = 'cog/workflow-service';

/**
 * WorkflowTemplateService class to be used to retrieve data from AliEcs Core about workflow templates to be used for environment creation
 */
class WorkflowTemplateService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcServiceClient} coreGrpc - service for retrieving information through AliECS Core gRPC connection
   * @param {GrpcServiceClient} apricotGrpc - service for retrieving information through AliECS Apricot gRPC connection
   */
  constructor(coreGrpc, apricotGrpc) {
    this._coreGrpc = coreGrpc;
    this._apricotGrpc = apricotGrpc;

    this._logger =  LogManager.getLogger(LOG_FACILITY);
  }

  /**
   * Retrieve the default template that is to be used for data-processing
   * @returns {WorkflowTemplateSource}
   * @throws
   */
  async getDefaultTemplateSource() {
    /**
     * @type {grpc.core.ListReposReply}
     */
    let repositoriesReply = {};
    try {
      repositoriesReply = await this._coreGrpc['ListRepos']();
      
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
    const { repos = [] } = repositoriesReply;
    const defaultRepository = repos.find((repository) => repository.default);

    if (!defaultRepository) {
      throw new NotFoundError(`Unable to find a default repository`);
    }
    const {name: repository, defaultRevision: revision} = defaultRepository;

    if (!revision) {
      throw new NotFoundError(`Unable to find a default revision`);
    }
    return {
      repository,
      revision,
      template: 'readout-dataflow'
    };
  }

  /**
   * Retrieve a list of mappings for simplified creation of environments based on workflow saved configurations
   * @return {Array<{label: String, configuration: String}>} - list of mappings to be displayed
   * @throws
   */
  async retrieveWorkflowMappings() {
    let mappingsString = '';
    try {
      mappingsString = await this._apricotGrpc.getRuntimeEntryByComponent(COG, WORKFLOW_MAPPINGS);
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
    const mappings = JSON.parse(mappingsString);
    if (!Array.isArray(mappings)) {
      throw new Error('WorkflowMappings returned from data store are not an array');
    }
    return mappings.sort(({ label: labelA }, { label: labelB }) => labelA.localeCompare(labelB));
  }

  /**
   * Using apricot service, retrieve the content of a saved configuration by name
   * @param {String} name - configuration that needs to be retrieved
   * @return {Object} - object with saved configuration
   * @throws
   */
  async retrieveWorkflowSavedConfiguration(name) {
    let configurationString = '';
    try {
      configurationString = await this._apricotGrpc.getRuntimeEntryByComponent(COG_V1, name);
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
    return JSON.parse(configurationString);
  }
}

module.exports = {WorkflowTemplateService};
