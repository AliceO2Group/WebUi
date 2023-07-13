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
const {updateExpressResponseFromNativeError} = require('../errors/updateExpressResponseFromNativeError');

/**
 * Controller for dealing with all API requests on environments from AliECS:
 */
class EnvironmentController {
  /**
   * Constructor for initializing controller of environments
   * @param {EnvironmentService} envService - service to use to query AliECS with regards to environments
   */
  constructor(envService) {
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/framework`);

    /**
     * @type {EnvironmentService}
     */
    this._envService = envService;
  }

  /**
   * API - GET endpoint for retrieving data about an AliECS environment by its id
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object with EnvironmentDetails
   * @returns {void}
   */
  async getEnvironment(req, res) {
    const {id} = req.params;
    if (!id) {
      res.status(400).json({message: 'Missing environment ID parameter'});
    }
    try {
      const response = await this._envService.getEnvironment(id);
      res.status(200).json(response);
    } catch (error) {
      updateExpressResponseFromNativeError(res, error);
    }
  }

}

module.exports = {EnvironmentController};
