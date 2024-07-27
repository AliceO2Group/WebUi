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
const LOG_FACILITY = 'run-ctrl';
const {updateExpressResponseFromNativeError} = require('./../errors/updateExpressResponseFromNativeError.js');
const {CacheKeys} = require('./../common/cacheKeys.enum.js');
const {LOG_LEVEL} = require('./../common/logLevel.enum.js');

/**
 * Controller for dealing with all API requests on retrieving information on runs
 */
class RunController {
  /**
   * Constructor for initializing controller of runs
   * @param {RunService} runService - service to use to build information on runs
   * @param {CacheService} cacheService - service to use for retrieving information stored in-memory
   */
  constructor(runService, cacheService) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/run-ctrl`);

    /**
     * @type {RunService}
     */
    this._runService = runService;

    /**
     * @type {CacheService}
     */
    this._cacheService = cacheService;
  }

  /**
   * API - GET endpoint for retrieving calibration runs
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async getCalibrationRunsHandler(_, res) {
    let calibrationRuns;
    try {
      calibrationRuns = this._cacheService.getByKey(CacheKeys.CALIBRATION_RUNS_BY_DETECTOR);
    } catch (error) {
      this._logger.debug(`Unable to serve from cache due to: ${error}`);
    }
    try {
      if (!calibrationRuns) {
        calibrationRuns = await this._runService.retrieveCalibrationRunsGroupedByDetector();
      }
      res.status(200).json(calibrationRuns);
    } catch (error) {
      this._logger.debug(error);
      updateExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - GET endpoint to request a re-init of the run service which will update calibration configurations
   * The handler also must check that the user making the request is allowed for such operation
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async refreshCalibrationRunsConfigurationHandler(req, res) {
    try {
      let logMessage = `Refresh calibration configuration requested by user(${req.session.username})`;
      this._logger.infoMessage(logMessage, {level: LOG_LEVEL.OPERATIONS, system: 'GUI', facility: LOG_FACILITY});

      await this._runService.retrieveStaticConfigurations();
      res.status(200).json({ok: true});
    } catch (error) {
      const logMessage = `Error refreshing calibration configuration by ${req.session.username} due to: ${error}`;
      this._logger.errorMessage(logMessage, {level: LOG_LEVEL.OPERATIONS, facility: LOG_FACILITY})

      updateExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = {RunController};
