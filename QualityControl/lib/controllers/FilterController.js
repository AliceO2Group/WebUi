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
  InvalidInputError,
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
   */
  constructor(filterService) {
    /**
     * @type {FilterService}
     */
    this._filterService = filterService;
    this._logger = LogManager.getLogger('FilterController');
  }

  /**
   * HTTP GET endpoint for retrieving a list of run types from Bookkeeping
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response to provide run types information
   */
  async getFilterConfigurationHandler(req, res) {
    try {
      let runTypes = [];
      if (this._filterService) {
        runTypes = await this._filterService.runTypes;
      }
      res.status(200).json({
        runTypes,
      });
    } catch (error) {
      res.status(503).json({ error: error.message || error });
    }
  }

  /**
   * HTTP GET endpoint for retrieving run status information from Bookkeeping
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response to provide run status information
   * @returns {Promise<void>} - Promise to be resolved when the response has been sent
   */
  async getRunStatusHandler(req, res) {
    try {
      const { runNumber } = req.params;
      if (!runNumber) {
        return updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Run number not provided'));
      }
      const runStatus = await this._filterService.getRunStatus(runNumber);
      res.status(200).json(runStatus);
    } catch (error) {
      this._logger
        .errorMessage(`Failed to retrieve run status for run ${req.params?.runNumber}: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, new Error('Failed to retrieve run status'));
    }
  }
}
