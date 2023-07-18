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

/**
 * Controller for dealing with all API requests on workflow templates from AliECS:
 */
class WorkflowTemplateController {
  /**
   * Constructor for initializing controller of workflow templates
   * @param {WorkflowTemplateService} workflowService - service to use to query AliECS with regards to workflow templates
   */
  constructor(workflowService) {
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/workflow-ctrl`);

    /**
     * @type {WorkflowTemplateService}
     */
    this._workflowService = workflowService;
  }

  /**
   * API - GET endpoint for retrieving source of the default workflow template used by AliECS
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object with EnvironmentDetails
   * @returns {void}
   */
  async getDefaultTemplateSource(_, res) {
    try {
      const response = await this._workflowService.getDefaultTemplateSource();
      res.status(200).json(response);
    } catch (error) {
      updateExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = {WorkflowTemplateController};
