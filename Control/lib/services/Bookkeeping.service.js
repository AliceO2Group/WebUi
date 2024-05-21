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
const {httpGetJson} = require('./../utils.js');
const RunSummaryAdapter = require('./../adapters/RunSummaryAdapter.js');
const {BookkeepingFilterAdapter} = require('./../adapters/external/BookkeepingFilterAdapter.js');

const DEFAULT_REFRESH_RATE = 30000;

/**
 * BookkeepingService class to be used to retrieve data from Bookkeeping
 */
class BookkeepingService {
  /**
   * Constructor for configuring the service to retrieve data via Bookkeeping HTTP API
   * @param {Object} config = {url: string, token: string} - configuration for using BKP service
   */
  constructor({url, token, refreshRate}) {
    this._url = url ?? null;
    const {protocol, hostname, port} = url ? new URL(this._url) : {};
    this._hostname = hostname;
    this._port = port;
    this._protocol = protocol;

    this._token = token ?? '';
    this._refreshRate = refreshRate ?? DEFAULT_REFRESH_RATE;

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/bkp-service`);
  }

  /**
   * Given a definition, a type of a run and a detector, fetch from Bookkeeping the last RUN matching the parameters
   * @param {Object<String, Object>} filter - definition of the run to query
   * @return {RunSummary|{}} - run object from Bookkeeping
   */
  async getRun(filter) {
    const filterAsString = BookkeepingFilterAdapter.toString(filter);
    try {
      const {data} = await httpGetJson(this._hostname, this._port, `/api/runs?${filterAsString}&token=${this._token}`, {
        protocol: this._protocol,
        rejectUnauthorized: false,
      });
      if (data?.length > 0) {
        return RunSummaryAdapter.toEntity(data[0]);
      }
    } catch (error) {
      this._logger.debug(error);
    }
    return null;
  }

  /**
   * Method to fetch run types from Bookkeeping and build a map of types to IDs as needed for filtering in RUNs API
   * @returns {Object<String, Number>} - map of runtypes to their ID
   */
  async getRunTypes() {
    try {
      const runTypesMap = {};
      const {data} = await httpGetJson(this._hostname, this._port, `/api/runTypes?token=${this._token}`, {
        protocol: this._protocol,
        rejectUnauthorized: false,
      });
      for (const type of data) {
        runTypesMap[type.name] = type.id;
      }
      return runTypesMap;
    } catch (error) {
      this._logger.debug(error);
    }
    return {};
  }

  /**
   * Getters & Setters
   */

  /**
   * Getter for retrieving the rate of refreshing data from Bookkeeping
   * @return {Number}
   */
  get refreshRate() {
    return this._refreshRate;
  }
}

module.exports = {BookkeepingService};
