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

const { grpcErrorToNativeError } = require('../errors/grpcErrorToNativeError.js');
const { NotFoundError } = require('./../errors/NotFoundError.js');

const RUNTIME_COMPONENT = 'COG';
const RUNTIME_CONFIGURATION = 'COG-v1';
const RUNTIME_KEY = 'workflow-mappings';

/**
 * WorkflowTemplateService class to be used to retrieve data from AliEcs Core about workflow templates to be used for environment creation
 */
class WorkflowTemplateService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcProxy} coreGrpc - service for retrieving information through AliECS Core gRPC connection
   * @param {ApricotService} apricotGrpc - service for retrieving information through AliECS Apricot gRPC connection
   */
  constructor(coreGrpc, apricotGrpc) {
    this._coreGrpc = coreGrpc;
    this._apricotGrpc = apricotGrpc;
  }

  /**
   * Retrieve the default template that is to be used for data-processing
   * @returns {WorkflowTemplateSource}
   * @throws
   */
  async getDefaultTemplateSource() {
    const { repos: repositories } = await this._coreGrpc['ListRepos']();
    const defaultRepository = repositories.find((repository) => repository.default);

    if (!defaultRepository) {
      throw new NotFoundError('Unable to find a default repository');
    }
    const { name: repository, defaultRevision: revision } = defaultRepository;

    if (!revision) {
      throw new NotFoundError('Unable to find a default revision');
    }
    return {
      repository,
      revision,
      template: 'readout-dataflow',
    };
  }

  /**
   * Retrieve a list of mappings for simplified creation of environments based on workflow saved configurations
   * @returns {Array<{label: string, configuration: string}>} - list of mappings to be displayed
   */
  async retrieveWorkflowMappings() {
    try {
      const mappingsString = await this._apricotGrpc.getRuntimeEntryByComponent(RUNTIME_COMPONENT, RUNTIME_KEY);
      const mappings = JSON.parse(mappingsString);
      if (Array.isArray(mappings)) {
        return mappings.sort(({ label: labelA }, { label: labelB }) => labelA < labelB ? -1 : 1);
      }

      return [];
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
  }

  /**
   * Using apricot service, retrieve the content of a saved configuration by name
   * @param {string} name - configuration that needs to be retrieved
   * @returns {object} - object with saved configuration
   */
  async retrieveWorkflowSavedConfiguration(name) {
    try {
      const configurationString = await this._apricotGrpc.getRuntimeEntryByComponent(RUNTIME_CONFIGURATION, name);
      const configuration = JSON.parse(configurationString);
      return configuration;
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
  }
}

module.exports = { WorkflowTemplateService };
