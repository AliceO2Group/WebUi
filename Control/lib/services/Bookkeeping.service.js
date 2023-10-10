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

/**
 * BookkeepingService class to be used to retrieve data from Bookkeeping
 */
class BookkeepingService {
  /**
   * Constructor for configuring the service to retrieve data via Bookkeeping HTTP API
   * @param {Object} config = {url: string, token: string} - configuration for using BKP service
   */
  constructor({url = '', token = ''}) {
    this._url = url;
    const {protocol, hostname, port} = new URL(this._url);
    this._hostname = hostname;
    this._port = port;
    this._protocol = protocol;

    this._token = token;

    this._runTypes = {}; // in-memory object which is filled with runTypes on server start
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/bkp-service`);
  }

  /**
   * Method to initialize the run service with static data such as runTypes
   * @return {void}
   */
  async init() {
    this._runTypes = await this._getRunTypes();
  }

  /**
   * Given a definition, a type of a run and a detector, fetch from Bookkeeping the last RUN matching the parameters
   * @param {String} definition - definition of the run to query
   * @param {String} type - type of the run to query
   * @param {String} detector - detector which contained the run
   * @return {RunSummary|{}} - run object from Bookkeeping
   */
  async getRun(definition, type, detector) {
    if (this._runTypes[type]) {
      let filter = `filter[definitions]=${definition}&filter[runTypes]=${this._runTypes[type]}&page[limit]=1&`;
      filter += `filter[detectors][operator]=and&filter[detectors][values]=${detector}`
      try {
        const {data} = await httpGetJson(this._hostname, this._port, `/api/runs?${filter}&token=${this._token}`, {
          protocol: this._protocol,
          rejectUnauthorized: false,
        });
        if (data?.length > 0) {
          return RunSummaryAdapter.toEntity(data[0]);
        }
      } catch (error) {
        this._logger.debug(error);
      }
    }
    return {};
  }

  /**
   * Method to fetch run types from Bookkeeping and build a map of types to IDs as needed for filtering in RUNs API
   * @returns {Object<String, Number>} - map of runtypes to their ID
   */
  async _getRunTypes() {
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
   * Getters/Setters
   */

  /**
   * Return the object storing run types by their name with ID
   * @return {Object<String, Number>}
   */
  get runTypes() {
    return this._runTypes;
  }
}

module.exports = {BookkeepingService};
