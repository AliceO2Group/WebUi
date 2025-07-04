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
import { parseObjects } from '../../common/library/qcObject/utils.js';
import QCObjectDto from '../dtos/QCObjectDto.js';

/**
 * A service that fetches information about runs and their status.
 */
export class RunModeService {
  /**
   * Creates a new RunModeService to fetch objects paths and their associated run status
   * @param {object} config - Configuration defined as `bookkeeping` in the config file.
   * @param {BookkeepingService} bookkeepingService - Used to check the status of a run.
   * @param {CcdbService} dataService - Used to fetch data from the CCDB.
   */
  constructor(
    config,
    bookkeepingService,
    dataService,
  ) {
    this._bookkeepingService = bookkeepingService;
    this._dataService = dataService;

    this._ongoingRuns = new Map();
    this._lastRunsRefresh = 0;
    if (!config) {
      this._refreshRunsInterval = -1; // No refresh if no config is provided
    } else {
      this._refreshRunsInterval = config?.refreshInterval || 30 * 1000;
    }

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/run-mode-service`);
  }

  /**
   * Starts monitoring when the parameters contain a RunNumber, and the run is determined to be ongoing
   * @param {number} runNumber - RunNumber to be applied when fetching list of objects.
   * @returns {Promise<{ paths: QCObjectDto[], runStatus: RunStatus }>}
   */
  async retrievePathsAndSetRunStatus(runNumber) {
    if (this._ongoingRuns.has(runNumber)) {
      const cachedPaths = parseObjects(this._ongoingRuns.get(runNumber), QCObjectDto);
      return { paths: cachedPaths, runStatus: RunStatus.ONGOING };
    }

    const runStatus = await this._bookkeepingService.retrieveRunStatus(runNumber);
    const rawPaths = await this._dataService.getObjectsLatestVersionList({
      filters: { RunNumber: runNumber },
    });

    if (runStatus === RunStatus.ONGOING) {
      this._ongoingRuns.set(runNumber, rawPaths);
    }

    const parsedPaths = parseObjects(rawPaths, QCObjectDto);

    return {
      paths: parsedPaths,
      runStatus,
    };
  }

  /**
   * Method to refresh the cache of ongoing runs.
   * It checks the status of each ongoing run and updates the paths if the run is still ongoing.
   * If the run has ended, it removes it from the cache.
   * @returns {Promise<void>}
   */
  async refreshRunsCache() {
    for (const [runNumber] of this._ongoingRuns.entries()) {
      try {
        const runStatus = await this._bookkeepingService.retrieveRunStatus(runNumber);
        if (runStatus === RunStatus.ONGOING) {
          const updatedPaths = await this._dataService.getObjectsLatestVersionList({
            filters: { RunNumber: runNumber },
          });
          this._ongoingRuns.set(runNumber, updatedPaths);
        } else {
          this._ongoingRuns.delete(runNumber);
        }
      } catch (error) {
        this._logger.errorMessage(`Error while refreshing run ${runNumber}: ${error.message || error}`);
      }
    }
    this._lastOngoingRunsRefresh = Date.now();
  }

  /**
   * Returns the last time the ongoing runs cache was refreshed.
   * @returns {number} - Timestamp of the last refresh. (ms)
   */
  get refreshInterval() {
    return this._refreshRunsInterval;
  }
}
