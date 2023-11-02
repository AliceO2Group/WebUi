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
const {Log} = require('@aliceo2/web-ui');
const {updateExpressResponseFromNativeError} = require('./../errors/updateExpressResponseFromNativeError.js');
const {InvalidInputError} = require('../errors/InvalidInputError.js');

/**
 * Controller for dealing with all API requests on environments from AliECS:
 */
class EnvironmentController {
  /**
   * Constructor for initializing controller of environments
   * @param {EnvironmentService} envService - service to use to query AliECS with regards to environments
   * @param {WorkflowTemplateService} workflowService - service to use to query Apricot for workflow details
   * @param {ApricotService} hardwareService - service to use to retrieve information on hardware of detectors
   */
  constructor(envService, workflowService, hardwareService) {
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/env-ctrl`);

    /**
     * @type {EnvironmentService}
     */
    this._envService = envService;

    /**
     * @type {WorkflowTemplateService}
     */
    this._workflowService = workflowService;

    /**
     * @type {ApricotService}
     */
    this._hardwareService = hardwareService;
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
      res.status(400).json({message: 'Missing environment ID parameter'});
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
   * API - POST endpoint for deploying a new environment based on a given configuration name
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object with EnvironmentDetails
   * @returns {void}
   */
  async newAutoEnvironmentHandler(req, res) {
    let workflowTemplatePath;
    let variables;
    const {configurationName} = req.body;

    if (!configurationName) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Missing Configuration Name for deployment'));
      return;
    }

    // Retrieve latest configuration version for given name
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
      const channelId = await this._envService.newAutoEnvironment(workflowTemplatePath, variables);
      res.status(200).json({channelId});
    } catch (error) {
      this._logger.debug(`Unable to deploy environment for ${workflowTemplatePath}`);
      updateExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = {EnvironmentController};
