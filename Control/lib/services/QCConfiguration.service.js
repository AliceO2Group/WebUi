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

const { NotFoundError, LogManager } = require("@aliceo2/web-ui");

/**
 * @class
 * QCConfigurationService class to be user for communicating with the Consul service
 */
class QCConfigurationService {
  /**
   * @constructor
   * Constructor for configuring the initial state of stored information
   * @param {ConsulService} consulService - service to communicate with Consul
   */
  constructor(consulService) {
    /**
     * @type {ConsulService}
     */
    this._consulService = consulService;
    
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? "cnf"}/qc-configuration-service`);
  }

  /**
   * Get keys of configurations stored in Consul
   * @param {String} prefix - prefix to filter the keys
   * @param {boolean} [recurse=false] - whether to recurse into subdirectories
   */
  async getKeysOfValidConfigurations(prefix, recurse = false) {
    let data;

    try {
      data = await this._consulService.getOnlyRawValuesByKeyPrefix(prefix);
    } catch (e) {
      return [];
    }

    return this.filterConfigurations(data, recurse, prefix);
  }

  /**
   * Get configuration by key from Consul
   * @param {string} key - the key of the configuration
   */
  async getConfigurationByKey(key) {
    try{
      return await this._consulService.getOnlyRawValueByKey(key);
    }catch (error) {
      this._logger.error(`Error getting configuration by key: ${key}`, error);
      throw new NotFoundError(`Configuration not found for key: ${key}`);
    }
  }


  /**
   * Filters a configuration object and returns keys of entries with valid JSON values.
   * @param {object} configs - an object with string values to be checked.
   * @param {boolean} recurse - whether to recurse into subdirectories
   * @param {string} prefix - the prefix to filter keys
   */
  filterConfigurations(configs, recurse, prefix) {
    const parsedData = [];
    Object.entries(configs || {}).forEach(([key, value]) => {
      try {
        if (!recurse && key.replace(`${prefix}/`, "").includes("/")) {
          return;
        }

        const parsedValue = JSON.parse(value);
        
        if (typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)) {
          parsedData.push(key);
        }
      } catch (e) {
        // skip
      }
    });

    return parsedData;
  }
}

exports.QCConfigurationService = QCConfigurationService;
