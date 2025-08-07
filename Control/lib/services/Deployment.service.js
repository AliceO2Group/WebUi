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

const {LogManager} = require('@aliceo2/web-ui');
const CoreUtils = require('./../control-core/CoreUtils.js');
const LOG_FACILITY = 'cog/deployment-service';

/**
 * **high-level service for deployment**
 * DeploymentService class  to be used to prepare a deployment configuration and request the deployment
 * of the environment via ECS
 * 
 * Important mentions:
 * * service 
 */
class DeploymentService {
  
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {EnvironmentService} environmentService - to use for creating new environments
   * @param {WorkflowService} workflowService - to use for retrieving template workflow information
   */
  constructor(environmentService, workflowService) {
    this._environmentService = environmentService;
    this._workflowService = workflowService;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/deployment-service`);
  }

  /**
   * Method to deploy put together a deployment configuration and request ECS to create a new environment asynchronously
   * An initial empty environment with its ID will be returned and the updates will be followed via Kafka
   * @param {object} deploymentConfiguration - the configuration to be used for deployment
   * @param {Map<string, object>} deploymentConfiguration.userVars - set of variables to be used for deployment
   * @param {string} [deploymentConfiguration.selectedConfiguration] - the name of the saved configuration to be used
   * @param {string} deploymentConfiguration.workflowTemplate - the workflow template to be used
   * @param {User} deploymentConfiguration.user - the user to be used for deployment
   * @return {EnvironmentInfo} - the id of the environment created
   * @throws {Error} - if the deployment fails or invalid input
   */
  async deployEnvironment({
    userVars,
    selectedConfiguration,
    workflowTemplate,
    user
  }) {
    userVars = await this._retrieveUserVars(userVars, selectedConfiguration);
    userVars = await this._buildUserVarsBasedOnSavedToIgnore(userVars, workflowTemplate);

    const environment = await this._environmentService.newEnvironmentAsync({workflowTemplate, userVars, user});
    return environment;
  }

  /**
   * @private
   * If a saved configuration name is provided, then configuration is build as follows:
   * - fetch the latest version of the chosen saved configuration
   * - replace in the earlier fetched configuration:
   * * - the hosts that were provided by the user in userVars
   * * - the EPN enabled flag that was provided by the user in userVars
   * * - the number of EPNs that was provided by the user in userVars
   * - ignore any other variables that were provided by the user and use the ones from the saved configuration
   * 
   * If no saved configuration name is provided, the requested variables are returned as they were.
   * 
   * @param {object} requestedVars - the variables requested by the user
   * @param {string} savedConfigurationName - the name of the selected configuration
   * @param {array} requestedVars.hosts - hosts requested by the user
   * @param {string} requestedVars.epn_enabled - whether EPN should be enabled
   * @param {string} requestedVars.odc_n_epns - number of EPNs requested by the user if EPN is enabled
   * @returns {object} - the updated configuration variables, aka 'vars'
   * @throws {Error} - if the saved configuration cannot be retrieved or if the parsing fails
   */
  async _retrieveUserVars(requestedVars, savedConfigurationName = undefined) {
    if (savedConfigurationName && savedConfigurationName.trim() !== '') {
        const { variables } = await this._workflowService.retrieveWorkflowSavedConfiguration(savedConfigurationName);

        const { hosts = [], epn_enabled = 'false', odc_n_epns = '0' } = requestedVars;
        variables.hosts = hosts;
        variables.epn_enabled = epn_enabled;
        variables.odc_n_epns = odc_n_epns;
        return variables;
    }
    return requestedVars;
  }
  
  /**
   * @private
   * Method to retrieve the hosts to ignore for a given run type value that is present in user requested variables
   * @param {object} userVars - the variables requested by the user. Need to contain 
   * * userVars.runType - the run type to be used for deployment
   * * userVars.hosts - the hosts to be used for deployment
   * @param {string} workflowTemplate - the workflow template to be used for deployment
   * @returns {array<string>} - the hosts to ignore for the given run type
   * @throws {Error} - if hosts to ignore cannot be retrieved or if the parsing fails
   */
  async _buildUserVarsBasedOnSavedToIgnore(userVars, workflowTemplate) {
    let userVarsCopy = JSON.parse(JSON.stringify(userVars));
    const runType = CoreUtils.getRunType({ vars: userVars });
    const hostsToIgnoreForRunType = await this._workflowService.retrieveHostsToIgnore(runType);
    const environmentCreationPayload = CoreUtils.parseEnvironmentCreationPayload(
      { vars: userVarsCopy, workflowTemplate },
      hostsToIgnoreForRunType
    );
    return environmentCreationPayload.vars;
  }
}

module.exports.DeploymentService = DeploymentService;
