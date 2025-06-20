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
'use strict';
import { LogManager, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';
import { RunStatus } from '../../common/library/runStatus.enum.js';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/object-ctrl`);

/**
 * Gateway for all QC Objects requests
 * @class
 */
export class ObjectController {
  /**
   * Setup Object Controller:
   * - CcdbService - retrieve data about objects
   * @param {QCObjectService} objService - objService to be used for retrieval of information
   * @param {FilterService} filterService - objService to be used for retrieval run statuses
   * @param {IntervalsService} intervalsService - service to manage intervals for active runs
   */
  constructor(objService, filterService, intervalsService) {
    /**
     * @type {QCObjectService}
     */
    this._objService = objService;
    this._filterService = filterService;
    this._intervalsService = intervalsService;
    this._UPDATE_INTERVAL = 30 * 1000;
  }

  /**
   * Retrieve a list of objects from CCDB with requested fields or default selection
   * @param {Request} req - HTTP request object with "query" information on object
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjects(req, res) {
    const { prefix, fields, filters } = req.query;
    const callbackParams = { prefix, fields, filters };
    const callback = this._objService.retrieveLatestVersionOfObjects.bind(this._objService);
    await this._handleDataRetrieval(callbackParams, callback, res, 'Failed to retrieve list of objects latest version');
  }

  /**
   * Using `browse` option, request a list of `last-modified` and `valid-from` for a specified path for an object
   * Use the first `validFrom` option to make a head request to CCDB; Request which will in turn return object
   * information and download it locally on CCDB if it is not already done so;
   * From the information retrieved above, use the location with JSROOT to get a JSON object
   * Use JSROOT to decompress a ROOT object content and convert it to JSON to be sent back to the client for
   * interpretation with JSROOT.draw
   * @param {Request} req - HTTP request object with "query" information
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjectContent(req, res) {
    const { path, validFrom, filters, id } = req.query;
    const callbackParams = { path, validFrom, filters, id };

    const callback = this._objService.retrieveQcObject.bind(this._objService);

    await this._handleDataRetrieval(callbackParams, callback, res, 'Failed to retrieve object content');
  }

  async getObjectById(req, res) {
    const qcObjectId = req.params.id;
    const { validFrom, filters, id } = req.query;
    const callbackParams = { validFrom, filters, id, qcObjectId };
    const callback = this._objService.retrieveQcObjectByQcgId.bind(this._objService);

    await this._handleDataRetrieval(callbackParams, callback, res, 'Unable to identify object or read it by qcg id');
  }

  /**
   * Check the status of a run based on provided filters
   * @param {number} runNumber - Identifier of the run whose status is being checked
   * @returns {Promise<RunStatus|null>} - Promise resolving to run status or null if no RunNumber in filters
   */
  async checkRunStatus(runNumber) {
    return await this._filterService.getRunStatus(runNumber);
  }

  /**
   * Helper function to handle cached data retrieval and active run monitoring
   * @param {object} callbackParams - Parameters for the callback function
   * @param {Function} callback - The function to call for data retrieval
   * @param {Response} res - HTTP response object
   * @param {string} errorMessage - Error message to use if something fails
   * @returns {Promise<void>}
   */
  async _handleDataRetrieval(callbackParams, callback, res, errorMessage) {
    try {
      const RunNumber = callbackParams.filters?.RunNumber;
      const queryKey = JSON.stringify(callbackParams);
      const cachedData = this._objService.getRunCache(queryKey);
      let runStatus = null;

      if (cachedData) {
        return res.status(200).json(cachedData.data);
      }

      if (RunNumber) {
        runStatus = await this.checkRunStatus(RunNumber);
      }

      const data = await callback(callbackParams);

      if (runStatus === RunStatus.ACTIVE) {
        await this._setupActiveRunMonitoring(queryKey, callbackParams, callback);
      }

      res.status(200).json(data);
    } catch (error) {
      const responseError = new Error(errorMessage);
      logger.errorMessage(`Error fetching retrieving data: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, responseError);
    }
  }

  /**
   * Set up periodic monitoring for an active run with specific query parameters
   * @param {string} queryKey - The unique key for the query parameters
   * @param {object} callbackParams - The parameter object to be used for the calback function parameters
   * @param {Function} callback - The function that will be used to update the cache.
   * @returns {Promise<void>}
   */
  async _setupActiveRunMonitoring(queryKey, callbackParams, callback) {
    if (this._intervalsService.activeInterval(queryKey)) {
      return;
    }
    logger.infoMessage(`Setting up periodic monitoring for query ${queryKey}`);

    await this._updateAndCheckStatus(queryKey, callbackParams, callback);

    this._intervalsService.register(
      this._updateAndCheckStatus.bind(this, queryKey, callbackParams, callback),
      this._filterService.runStatusRefreshInterval,
      queryKey,
    );
  }

  /**
   * Update cache and check run status for active run monitoring
   * @param {string} queryKey - The unique key for the query parameters
   * @param {object} callbackParams - The parameter object to be used for the calback function parameters
   * @param {Function} callback - The function that will be used to update the cache.
   * @returns {Promise<void>}
   */
  async _updateAndCheckStatus(queryKey, callbackParams, callback) {
    try {
      const { RunNumber } = callbackParams.filters;
      const status = await this.checkRunStatus(RunNumber);

      if (status !== RunStatus.ACTIVE) {
        logger.infoMessage(`Run ${RunNumber} is no longer active, stopping monitoring`);
        this._cleanupRunMonitoring(queryKey);
        return;
      }

      const data = await callback(callbackParams);
      this._objService.setRunCache(queryKey, { data, timestamp: Date.now() });
      logger.debugMessage(`Updated cache for query ${queryKey}`);
    } catch (error) {
      logger.errorMessage(`Failed to update cache or check status for query ${queryKey}: ${error}`);
    }
  }

  /**
   * Clean up monitoring for a specific query
   * @param {string} queryKey - The unique key for the query parameters
   */
  _cleanupRunMonitoring(queryKey) {
    this._intervalsService.deregister(queryKey);
    this._objService.removeRunCache(queryKey);
  }
}
