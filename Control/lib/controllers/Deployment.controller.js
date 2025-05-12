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

const {
  LogManager,
  LogLevel,
  InvalidInputError,
  updateAndSendExpressResponseFromNativeError
} = require('@aliceo2/web-ui');
const { User } = require('./../dtos/User.js');

const LOG_FACILITY = 'cog/deploy-ctrl';

const DeploymentType = {
  ADVANCED: 'ADVANCED',
  GLOBAL: 'GLOBAL'
}

/**
 * Controller for dealing with all API requests on deploying environments
 * A deployment does not incorporate only requesting ECS to create a new environment but instead it incorporates multiple steps such as:
 * - reloading latest configuration
 * - checking if there are FLPs that should be ignored even if user's select them
 */
class DeploymentController {
  /**
   * Constructor for initializing controller of environments
   * @param {DeploymentService} deploymentService - service to use to deploy environments
   */
  constructor(deploymentService) {
    this._logger = LogManager.getLogger(LOG_FACILITY);

    /**
     * @type {DeploymentService}
     */
    this._deploymentService = deploymentService;
  }

  /**
   * API - POST endpoint for deploying a new environment
   *
   * * Type Advanced: Deployment which implies that the user:
   * * * sends a configuration name for the workflow template
   * * * variables to use for deployment which may contain number of EPNs
   * * * detectors to be used - so that ECS GUI can check if detectors are available
   * * * hosts to be used - so that ECS GUI can check if hosts should be removed
   * * * Object currently sent by Advanced Environment Creation page:
   * @example {
   *    workflowTemplate - in format '<repository>/workflows/<template>@<revision>'
   *    vars - object with the variables to be used for deployment, (contains hosts and number of EPNs)
   *    detectors - array of detectors to be used (used in middleware to check if detectors are available),
   *  }
   *
   * * Type Global: Deployments based on saved configurations implies that the user:
   * * * sends a configuration name that already exists in saved configurations
   * * * number of EPNs to be used if EPN is enabled in the configuration
   * * * detectors to be used - so that ECS GUI can check if detectors are available
   * * * hosts to be used - so that ECS GUI can check if hosts should be removed 
   * * * Object currently sent by Global Creation page:
   * @example {
   *    workflowTemplate - in format '<repository>/workflows/<template>@<revision>'
   *    selectedConfiguration - string with the name of the configuration,
   *    vars - object with the variables to be used for deployment, (contains hosts and number of EPNs)
   *    detectors - array of detectors to be used (used in middleware to check if detectors are available),
   *  }
   * @param {Request} req - HTTP Request object
   * @param {object} req.body - request body containing workflowTemplate, detectors, vars
   * @param {string} req.body.workflowTemplate - workflow template to use for the environment
   * @param {object} req.body.vars - variables to use for the environment
   * @param {string} req.body.selectedConfiguration - name of the saved configuration to use
   * @param {Response} res - HTTP Response object with EnvironmentDetails
   */
  async deploymentHandler(req, res) {
    const {type} = req.params;
    const { personid, name, username } = req.session;
    const user = new User(username, name, personid);

    const { selectedConfiguration = undefined, vars, workflowTemplate } = req.body;
    if (!workflowTemplate || workflowTemplate.trim() === '') {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Missing Workflow Template for deployment')
      );
      return;
    }
    if (!vars) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid input: missing vars for deployment')
      );
      return;
    }

    if (type === DeploymentType.GLOBAL) {
      if (!selectedConfiguration || selectedConfiguration.trim() === '') {
        updateAndSendExpressResponseFromNativeError(
          res,
          new InvalidInputError('Missing Configuration Name for deployment')
        );
        return;
      }
    }

    try {
      const environment = await this._deploymentService.deployEnvironment({
        userVars: vars,
        selectedConfiguration,
        workflowTemplate,
        user
      });
      this._logger.infoMessage(`Request by username(${username}) to deploy environment ${environment.id}`,
        {level: LogLevel.SUPPORT, system: 'GUI', facility: LOG_FACILITY}
      );
      console.log('controller environment', environment);
      res.status(200).json(environment);
    } catch (error) {
      this._logger.errorMessage(`Request by username(${username}) to deploy environment failed. Error: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports.DeploymentController = DeploymentController;
