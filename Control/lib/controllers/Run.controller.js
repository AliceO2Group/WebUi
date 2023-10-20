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
 * Controller for dealing with all API requests on retrieving information on runs
 */
class RunController {
  /**
   * Constructor for initializing controller of runs
   * @param {RunService} runService - service to use to build information on runs
   */
  constructor(runService) {
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/env-ctrl`);

    /**
     * @type {RunService}
     */
    this._runService = runService;
  }

  /**
   * API - GET endpoint for retrieving calibration runs
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async getCalibrationRunsHandler(_, res) {
    try {
      const response = await this._runService.retrieveCalibrationRunsGroupedByDetector();
      res.status(200).json(response);
    } catch (error) {
      this._logger.debug(error);
      updateExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = {RunController};
