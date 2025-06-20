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

import { RunStatus } from '../../common/library/runStatus.enum.js';
import { httpGetJson } from '../utils/httpRequests.js';
import { LogManager } from '@aliceo2/web-ui';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'bkp-service'}`);
const GET_BKP_DATABASE_STATUS_PATH = '/api/status/database';
const GET_RUN_TYPES_PATH = '/api/runTypes';
const GET_RUN_PATH = '/api/runs';

/**
 * BookkeepingService class to be used to retrieve data from Bookkeeping
 */
export class BookkeepingService {
  constructor(config) {
    this.config = config;
    this.active = false;
    this.error = null;

    this._hostname = '';
    this._port = null;
    this._token = '';
    this._protocol = '';
    this._runTypesRefreshInterval = config?.runTypesRefreshInterval ?? 24 * 60 * 60 * 1000;
    this._runStatusRefreshInterval = config?.runStatusRefreshInterval;
  }

  /**
   * Validates the configuration for the bookkeeping service.
   * @returns {boolean} Returns true if the configuration is valid, otherwise false.
   */
  validateConfig() {
    if (!this.config) {
      this.error = 'Configuration for bookkeeping not provided';
      return false;
    }
    const { url, token } = this.config || {};
    try {
      const normalizedURL = new URL(url);
      this._hostname = normalizedURL.hostname;
      this._protocol = normalizedURL.protocol;
      this._port = normalizedURL.port || (normalizedURL.protocol === 'https:' ? 443 : 80);
    } catch {
      this.error = `Invalid configuration. ${url} is not a valid URL`;
      return false;
    }
    if (!token || typeof token !== 'string' || token.trim() === '') {
      this.error = 'Invalid configuration. Token not provided or empty';
      return false;
    }
    this._token = token;
    return true;
  }

  /**
   * Connects to the bookkeeping service after validating the configuration.
   * @returns {Promise<void>} Resolves if the connection is successful or logs an error if the connection fails.
   */
  async connect() {
    if (!this.validateConfig()) {
      logger.infoMessage(`Bookkeeping service will not be used. Reason: ${this.error}`);
      return;
    }
    this.active = await this.simulateConnection();
    if (!this.active) {
      logger.infoMessage(`Bookkeeping service will not be used. Reason: ${this.error}`);
    }
  }

  /**
   * Simulates a connection to the bookkeeping service and checks the status.
   * @returns {Promise<boolean>} Resolves to true if the connection is successful, otherwise false.
   */
  async simulateConnection() {
    try {
      const { data } = await httpGetJson(
        this._hostname,
        this._port,
        `${GET_BKP_DATABASE_STATUS_PATH}?token=${this._token}`,
        {
          protocol: this._protocol,
          rejectUnauthorized: false,
        },
      );
      if (data && data?.status?.ok && data?.status?.configured) {
        logger.infoMessage('Successfully connected to Bookkeeping');
        return true;
      } else {
        this.error = 'Bookkeeping service is not configured or status is not OK';
        return false;
      }
    } catch (err) {
      this.error = `Error trying to connect to Bookkeeping: ${err || err.message}`;
      return false;
    }
  }

  /**
   * Retrieve the list of run types from the bookkeeping service.
   * @returns {Promise<object>} Resolves with the data of available run types.
   */
  async retrieveRunTypes() {
    const { data } = await httpGetJson(
      this._hostname,
      this._port,
      this._createPath(GET_RUN_TYPES_PATH),
      {
        protocol: this._protocol,
        rejectUnauthorized: false,
      },
    );
    return data;
  }

  /**
   * Retrieves the status of a specific run from the Bookkeeping service
   * @param {number} runNumber - The run number to check the status for
   * @returns {Promise<RunStatus>} - Returns a promise that resolves to the run status:
   *                                 - RunStatus.ACTIVE if the run is ongoing
   *                                 - RunStatus.FINISHED if the run has completed (has timeO2End)
   *                                 - RunStatus.INVALID if there was an error or data is not available
   */
  async retrieveRunStatus(runNumber) {
    try {
      const { data } = await httpGetJson(this._hostname, this._port, this._createRunPath(runNumber), {
        protocol: this._protocol,
        rejectUnauthorized: false,
      });

      if (!data) {
        logger.warnMessage(`The runstatus was invalid for run number ${runNumber}`);
        return RunStatus.INVALID; // an error occured in bookkeeping
      }

      if (data.timeO2End) {
        return RunStatus.FINISHED;
      }

      return RunStatus.ACTIVE;
    } catch (error) {
      logger.errorMessage(`An error occured whilst fetching run status: ${error.message || error}`);
      return RunStatus.INVALID;
    }
  }

  /**
   * Returns the interval in milliseconds for how often the list of run types should be refreshed.
   * @returns {number} Interval in milliseconds for refreshing the list of run types.
   */
  get runTypesRefreshRate() {
    return this._runTypesRefreshInterval;
  }

  /**
   * Returns the runStatusInterval in milliseconds
   * @returns {number} Interval in milliseconds for refreshing the status of a run.
   */
  get runStatusRefreshRate() {
    return this._runStatusRefreshInterval;
  }

  /**
   * Helper method to construct a URL path with the required authentication token.
   * Appends the service's token as a query parameter to the provided path.
   * @private
   * @param {string} path - The base path (e.g., `/api/endpoint`) to which the token will be appended.
   * @returns {string} The constructed path with the token query parameter (e.g., `/api/endpoint?token=ABC123`).
   */
  _createPath(path) {
    return `${path}?token=${this._token}`;
  }

  /**
   * Helper method to construct a URL path with the required authentication token.
   * Appends the service's token as a query parameter to the provided path.
   * @private
   * @param {number} RunNumber - The run number to be appended
   * @returns {string} The constructed run path with the token query parameter
   */
  _createRunPath(RunNumber) {
    return this._createPath(`${GET_RUN_PATH}/${RunNumber}`);
  }
}
