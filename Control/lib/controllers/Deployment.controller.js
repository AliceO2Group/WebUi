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
  updateAndSendExpressResponseFromNativeError,
  InvalidInputError
} = require('@aliceo2/web-ui');

const {User} = require('./../dtos/User.js');
const LOG_FACILITY = 'cog/deployment-ctrl';

/**
 * Controller Class for managing deployments via the AliECS system
 */
class DeploymentController {

  /**
   * Constructor for initializing controller with a deployment service
   * @param {DeploymentService} deploymentService - service to use to request AliECS a new deployment
   * @param {WorkflowService} workflowService - service to use to retrieve workflow templates
   */
  constructor(deploymentService, workflowService) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/deployment-ctrl`);

    /**
     * @type {DeploymentService}
     */
    this._deploymentService = deploymentService;

    /**
     * @type {WorkflowService}
     */
    this._workflowService = workflowService;
  }

  /**
   * Handles the request to make a deployment by:
   * - validating the user received request
   * - preparing the request payload for ECS
   * - calling the ECS service to deploy the environment
   *
   * User must be authenticated and authorized to perform this action and this is verified via middlewares
   *
   * A user can provide only the template that wishes to use or the entire workflowTemplate.
   * If only a template is provided, the default revision and repository will be used to build the template.
   * e.g. the resources-cleanup and calibration workflows require the latest default revision and repository
   *
   * The result of a deployment is an environment.
   *
   * @param {Express.Request} req - the request object
   * @param {Express.Response} res - the response object
   * @returns {Promise<void>}
   */
  async newAsyncDeploymentHandler(req, res) {
    /**
     * @type {DeploymentRequest}
     */
    const { template, selectedConfiguration, userVars, detectors, shouldAutoTransition } = req.body;
    let { repository, revision } = req.body;

    if (!template) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid input: template must be provided')
      );
      return;
    }

    if (!repository || !revision) {
      try {
        const defaults = await this._workflowService.getDefaultTemplateSource();
        if (!repository) {
          repository = defaults.repository;
        }
        if (!revision) {
          revision = defaults.revision;
        }
      } catch (error) {
        updateAndSendExpressResponseFromNativeError(res, error);
        return;
      }
    }
    const workflowTemplate = `${repository}/workflows/${template}@${revision}`;

    const { personid, name, username } = req.session || {};
    const user = new User(username, name, personid);

    const logMessage = 'New deployment request by '
      + `user ${user.username} with `
      + `workflow template ${workflowTemplate} `
      + `and detectors ${detectors}`;
    this._logger.infoMessage(logMessage, {
      level: LogLevel.OPERATIONS,
    });

    try {
      const environment = await this._deploymentService.deployEnvironment({
        userVars,
        selectedConfiguration,
        workflowTemplate,
        user,
        shouldAutoTransition,
        detectors,
      });
      res.status(201).json(environment);
    } catch (error) {
      this._logger.trace(error);
      this._logger.errorMessage(error, { level: LogLevel.SUPPORT });
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - POST endpoint for requesting a new deployment for calibration purposes. 
   * This is a specific endpoint separated from the generic deployment one as it has specific input requirements and validations.
   * @param {Request} req - HTTP Request object which expects a body with the following properties
   * @param {string[]} req.body.detectors - list of detectors for which the calibration environment should be deployed. Must contain exactly one detector.
   * @param {string} req.body.runType - the type of the calibration run to be performed which determines the workflow template to use
   * @param {string} req.body.configurationName - the name of the saved configuration to use for the deployment
   * @param {Response} res - HTTP Response object with result of the deployment request
   * @returns {void}
   */
  async newAsyncDeploymentCalibrationHandler(req, res) {
    const {personid, name, username} = req.session;
    const user = new User(username, name, personid);
    const { detectors, runType, selectedConfiguration } = req.body;
    
    if (detectors?.length !== 1) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Exactly one detector must be specified for deployment')
      );
      return;
    }
    const [detector] = detectors;

    if (!selectedConfiguration) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Missing Configuration Name for deployment')
      );
      return;
    }
   
    // Attempt to deploy environment
    try {
      this._logger.infoMessage(`Request by username(${username}) to deploy configuration ${selectedConfiguration}`,
        {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY}
      );
      const environment = await this._deploymentService.deployEnvironmentCalibration(
        {
          detector, runType, selectedConfiguration, user,
        }
      );
      res.status(201).json(environment);
    } catch (error) {
      this._logger.errorMessage(
        `Unable to deploy request by username(${username}) for ${selectedConfiguration} due to error`,
        {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY}
      );
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - DELETE endpoint for acknowledging an environment deployment failure
   * @param {Request} req - HTTP Request object which expects an `id` as mandatory parameter
   * @param {string} req.params.id - the id of the environment to be acknowledged
   * @param {Response} res - HTTP Response object with result of the acknowledgement
   * @returns {void}
   */
  async acknowledgeDeploymentFailureHandler(req, res) {
    const { id } = req.params;
    const { personid, name, username } = req.session || {};
    const user = new User(username, name, personid);

    if (!id) {
      updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Missing environment ID parameter'));
      return;
    }
    try {
      this._deploymentService.acknowledgeEnvironmentDeploymentFailure(id, user);
      res.status(204).json({ message: 'Environment deployment failure acknowledged' });
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = { DeploymentController };
