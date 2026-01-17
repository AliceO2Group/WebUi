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

import {
  LogManager,
  updateAndSendExpressResponseFromNativeError,
}
  from '@aliceo2/web-ui';

/**
 * Gateaway class to be used to retrieve data with regard to filters
 */
export class FilterController {
  /**
   * Creates an instance of FilterController class
   * @param {FilterService} filterService To retrieve the information displayed in the filters
   * @param {RunModeService} runsModeService To retrieve the ongoing runs
   */
  constructor(filterService, runsModeService) {
    /**
     * @type {FilterService}
     */
    this._filterService = filterService;

    /**
     * @type {RunModeService}
     */
    this._runsModeService = runsModeService;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/filter-ctrl`);
  }

  /**
   * HTTP GET endpoint for retrieving the status of a run from Bookkeeping
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response to provide run status information
   */
  async getRunInformationHandler(req, res) {
    try {
      const runInformation = await this._filterService.getRunInformation(req.params.runNumber);
      res.status(200).json(runInformation);
    } catch (error) {
      this._logger.errorMessage('Error getting run status:', error);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * HTTP GET endpoint for retrieving a list of run types from Bookkeeping
   * @param {Request} _ - HTTP request
   * @param {Response} res - HTTP response to provide run types information
   */
  getFilterConfigurationHandler(_, res) {
    try {
      const runTypes = this._filterService?.runTypes ?? [];
      const detectors = this._filterService?.detectors ?? [];
      res.status(200).json({
        runTypes,
        detectors,
      });
    } catch (error) {
      res.status(503).json({ error: error.message || error });
    }
  }

  /**
   * HTTP GET endpoint for retrieving a list of ongoing runs from Runs Mode Service
   * @param {Request} _ HTTP Request
   * @param {Response} res HTTP Response with the ongoing runs
   */
  getOngoingRunsHandler(_, res) {
    const ongoingRuns = this._runsModeService?.ongoingRuns ?? [];
    res.status(200).json({ ongoingRuns });
  }
}
