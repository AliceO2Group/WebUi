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

/**
 * Controller Class for managing deployments via the AliECS system
 */
class DeploymentController {

  /**
   * Constructor for initializing controller with a deployment service
   * @param {DeploymentService} deploymentService - service to use to request AliECS a new deployment
   */
  constructor(deploymentService) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/deployment-ctrl`);

    /**
     * @type {DeploymentService}
     */
    this._deploymentService = deploymentService;
  }

  /**
   * Handles the request to make a deployment by:
   * - validating the user built request
   * - preparing the request payload for ECS
   * - calling the ECS service to deploy the environment
   *
   * User must be authenticated and authorized to perform this action and this is verified via middlewares
   * 
   * The result of a deployment is an environment
   * 
   * @param {Express.Request} req - the request object
   * @param {Express.Response} res - the response object
   * @returns {Promise<void>}
   */
  async newAsyncDeploymentHandler(req, res) {
    /**
     * @type {DeploymentRequest}
     */
    const { workflowTemplate, selectedConfiguration, userVars, detectors } = req.body;

    if (!workflowTemplate && !selectedConfiguration) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid input: workflowTemplate or selectedConfiguration must be provided')
      )
      return;
    }

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
      });
      res.status(201).json(environment);
    } catch (error) {
      this._logger.errorMessage(error, { level: LogLevel.SUPPORT });
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
    this._envService.acknowledgeEnvironmentDeploymentFailure(id, user);
    res.status(204).json({ message: 'Environment deployment failure acknowledged' });
  }
}

module.exports = { DeploymentController };
