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
const {LogManager, LogLevel} = require('@aliceo2/web-ui');
const LOG_FACILITY = 'cog/env-ctrl';
const {EnvironmentTransitionType} = require('./../common/environmentTransitionType.enum.js');
const {grpcErrorToNativeError} = require('./../errors/grpcErrorToNativeError.js');
const {InvalidInputError} = require('./../errors/InvalidInputError.js');
const {UnauthorizedAccessError} = require('./../errors/UnauthorizedAccessError.js');
const {updateExpressResponseFromNativeError} = require('./../errors/updateExpressResponseFromNativeError.js');
const {User} = require('./../dtos/User.js');

/**
 * Controller for dealing with all API requests on environments from AliECS:
 */
class EnvironmentController {
  /**
   * Constructor for initializing controller of environments
   * @param {EnvironmentService} envService - service to use to query AliECS with regards to environments
   * @param {WorkflowTemplateService} workflowService - service to use to query Apricot for workflow details
   * @param {LockService} lockService - service to use to check lock is taken
   * @param {DetectorsService} detectorService - service to use to check on state of detectors
   */
  constructor(envService, workflowService, lockService, detectorService) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/env-ctrl`);

    /**
     * @type {EnvironmentService}
     */
    this._envService = envService;

    /**
     * @type {WorkflowTemplateService}
     */
    this._workflowService = workflowService;

    /**
     * @type {LockService}
     */
    this._lockService = lockService;

    /**
     * @type {DetectorsService}
     */
    this._detectorService = detectorService;
  }

  /**
   * API - GET endpoint for retrieving data about an AliECS environment by its id
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object with EnvironmentDetails
   * @returns {void}
   */
  async getEnvironmentHandler(req, res) {
    const {id, source} = req.params;
    if (!id) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Missing environment ID parameter'));
      return;
    }
    try {
      const response = await this._envService.getEnvironment(id, source);
      res.status(200).json(response);
    } catch (error) {
      this._logger.debug(error);
      updateExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - PUT endpoint for transitioning an environment to a new state
   * @param {Request} req - HTTP Request object which expects an `id` in params and `type` in body
   * @param {Response} res - HTTP Response object with result of the transition of the environment
   * @returns {void}
   */
  async transitionEnvironmentHandler(req, res) {
    const {personid, username, name} = req.session;
    const user = new User(username, name, personid);
    const {id} = req.params;
    const {type: transitionType, runNumber = ''} = req.body;
    if (!id) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Missing environment ID parameter'));
    } else if (!(transitionType in EnvironmentTransitionType)) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Invalid environment transition to perform'));
    } else {
      const transitionRequestedAt = Date.now();
      let response = null;
      this._logger.infoMessage(`Request to transition environment by ${req.session.username} to ${transitionType}`,
        {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY, partition: id, run: runNumber}
      );
      try {
        response = await this._envService.transitionEnvironment(id, transitionType, user);
        res.status(200).json(response);
      } catch (error) {
        this._logger.errorMessage(
          `Request to transition environment by ${req.session.username} to ${transitionType} failed due to ${error}`,
          {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY, partition: id, run: runNumber}
        );
        updateExpressResponseFromNativeError(res, error);
      }
      const currentRunNumber = response?.currentRunNumber ?? runNumber;
      this._logger.debug(`${transitionType},${id},${currentRunNumber},${transitionRequestedAt},${Date.now()}`);
    }
  }

  /**
   * API - DELETE endpoint for destroying an environment
   * @param {Request} req - HTTP Request object which expects an `id` as mandatory parameter
   * @param {Response} res - HTTP Response object with result of the transition of the environment
   * @returns {void}
   */
  async destroyEnvironmentHandler(req, res) {
    const {personid, name, username} = req.session;
    const user = new User(username, name, personid);
    const {id} = req.params ?? {};
    const {runNumber = '', keepTasks = false, allowInRunningState = false, force = false} = req.body ?? {};

    if (!id) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Missing environment ID parameter'));
    } else {
      const destroyRequestedAt = Date.now();
      this._logger.infoMessage(`Request to destroy environment by ${req.session.username} by force: ${force}`,
        {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY, partition: id, run: runNumber}
      );
      try {
        const response = await this._envService.destroyEnvironment(id, {keepTasks, allowInRunningState, force}, user);
        res.status(200).json(response);
      } catch (error) {
        this._logger.errorMessage(
          `Request to destroy environment by ${req.session.username} failed due to ${error}`,
          {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY, partition: id, run: runNumber}
        );
        updateExpressResponseFromNativeError(res, error);
      }
      this._logger.debug(`DESTROY_ENVIRONMENT,${id},${runNumber},${destroyRequestedAt},${Date.now()}`);
    }
  }

  /**
   * API - POST endpoint for deploying a new environment based on a given configuration name
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object with EnvironmentDetails
   * @returns {void}
   */
  async newAutoEnvironmentHandler(req, res) {
    const {personid, name, username} = req.session;
    const user = new User(username, name, personid);
    const {detector, runType, configurationName} = req.body;

    if (!this._lockService.isLockOwnedByUser(detector, user)) {
      updateExpressResponseFromNativeError(res, new UnauthorizedAccessError('Lock not taken'));
      return;
    }

    if (!configurationName) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Missing Configuration Name for deployment'));
      return;
    }

    try {
      const areDetectorsAvailable = await this._detectorService.areDetectorsAvailable([detector]);
      if (!areDetectorsAvailable) {
        updateExpressResponseFromNativeError(res, new InvalidInputError(`Detector ${detector} is already active`));
        return;
      }
    } catch (error) {
      updateExpressResponseFromNativeError(res, grpcErrorToNativeError(error));
      return;
    }

    // Retrieve latest configuration version for given name
    let variables;
    try {
      const configuration = await this._workflowService.retrieveWorkflowSavedConfiguration(configurationName);
      if (!configuration.variables) {
        throw new InvalidInputError(`No configuration variables found for ${configurationName}`);
      }
      variables = configuration.variables;
    } catch (error) {
      this._logger.debug(`Unable to retrieve saved configuration for ${configurationName} due to`);
      this._logger.debug(error);
      updateExpressResponseFromNativeError(res, error);
      return;
    }

    // Retrieve latest default workflow to use
    let workflowTemplatePath;
    try {
      const {template, repository, revision} = await this._workflowService.getDefaultTemplateSource();
      workflowTemplatePath = `${repository}/workflows/${template}@${revision}`;
    } catch (error) {
      this._logger.debug(`Unable to retrieve default workflow template due to ${error}`);
      updateExpressResponseFromNativeError(res, error);
      return;
    }
    // Attempt to deploy environment
    try {
      this._logger.infoMessage(`Request by username(${username}) to deploy configuration ${configurationName}`,
        {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY}
      );
      const environment = await this._envService.newAutoEnvironment(
        workflowTemplatePath, variables, detector, runType, user
      );
      res.status(200).json(environment);
    } catch (error) {
      this._logger.errorMessage(
        `Unable to deploy request by username(${username}) for ${configurationName} due to error`,
        {level: LogLevel.OPERATIONS, system: 'GUI', facility: LOG_FACILITY}
      );
      updateExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = {EnvironmentController};
