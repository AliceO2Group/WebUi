/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { LogManager } from '@aliceo2/web-ui';
import { RunStatus } from '../../common/library/runStatus.enum.js';

/**
 * A service that monitors the status of a run and keeps updating the cached data while the run is active.
 */
export class RunMonitoringService {
  /**
   * Creates a new RunMonitoringService to monitor the status of runs periodically.
   * @param {QcObjectService} objectService - Used to access and store cached run data.
   * @param {FilterService} filterService - Used to check the status of a run.
   * @param {IntervalsService} intervalsService - Used to manage periodic update intervals.
   */
  constructor(
    objectService,
    filterService,
    intervalsService,
  ) {
    this._objectService = objectService;
    this._filterService = filterService;
    this._intervalsService = intervalsService;

    // Set up a logger for this service
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/run-monitoring`);
  }

  /**
   * Starts monitoring if the run is active.
   *
   * If a RunNumber is found in the parameters and the run is active,
   * we start checking its status periodically and updating the cache.
   * @param {string} queryKey - Unique key used for identifying the cache entry.
   * @param {object} callbackParams - Parameters for the data-fetching callback (must include filters.RunNumber).
   * @param {Function} callback - A function to fetch updated data.
   * @returns {Promise<void>}
   */
  async handleRunMonitoring(queryKey, callbackParams, callback) {
    const runNumber = callbackParams.filters?.RunNumber;
    const runStatus = runNumber ? await this._checkRunStatus(runNumber) : null;
    if (runStatus === RunStatus.ACTIVE) {
      await this._startMonitoringInterval(queryKey, callbackParams, callback);
    }
  }

  /**
   * Starts a periodic interval that checks the run status and updates the cache.
   * @param {string} queryKey - Key used to identify this monitoring run.
   * @param {object} callbackParams - Parameters passed to the data-fetching callback.
   * @param {Function} callback - Function used to fetch and refresh data.
   * @returns {Promise<void>}
   */
  async _startMonitoringInterval(queryKey, callbackParams, callback) {
    // If we are already monitoring this run, do nothing
    if (this._intervalsService.activeInterval(queryKey)) {
      return;
    }

    await this._checkStatusAndUpdateCache(queryKey, callbackParams, callback);
    this._logger.infoMessage(`Setting up periodic monitoring for query ${queryKey}`);

    this._intervalsService.register(
      this._checkStatusAndUpdateCache.bind(this, queryKey, callbackParams, callback),
      this._filterService.runStatusRefreshInterval,
      queryKey,
    );
  }

  /**
   * Checks the run status. If still active, updates the cache with fresh data.
   * If not active anymore, stops monitoring.
   * @param {string} queryKey - Identifier for the cache and interval.
   * @param {object} callbackParams - Params used for fetching updated data.
   * @param {Function} callback - Function that returns fresh data.
   * @returns {Promise<void>}
   */
  async _checkStatusAndUpdateCache(queryKey, callbackParams, callback) {
    try {
      const runNumber = callbackParams.filters?.RunNumber;
      const status = await this._checkRunStatus(runNumber);

      if (status !== RunStatus.ACTIVE) {
        this._stopMonitoring(queryKey);
        this._logger.infoMessage(`Run ${runNumber} is no longer active, stopping monitoring`);
        return;
      }

      // Run is still active: get updated data and save it in the cache with a timestamp
      const data = await callback(callbackParams);
      this._objectService.setRunCache(queryKey, {
        data,
        timestamp: Date.now(),
      });
      this._logger.debugMessage(`Updated cache for query ${queryKey}`);
    } catch (error) {
      this._logger.errorMessage(`Failed to update cache or check status for query ${queryKey}: ${error}`);
    }
  }

  /**
   * Gets the current status of a given run from the filter service.
   * @param {string} runNumber - The number of the run.
   * @returns {Promise<RunStatus>}
   */
  async _checkRunStatus(runNumber) {
    return this._filterService.getRunStatus(runNumber);
  }

  /**
   * Stops monitoring a run by clearing the interval and removing cached data.
   * @param {string} queryKey - Identifier for the cache and interval to clean up.
   */
  _stopMonitoring(queryKey) {
    this._intervalsService.deregister(queryKey);
    this._objectService.removeRunCache(queryKey);
  }
}
