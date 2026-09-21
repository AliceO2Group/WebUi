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

const { LogManager } = require('@aliceo2/web-ui');
const QCConfigurationAdapter = require('../adapters/QCConfigurationAdapter');

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

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cnf'}/qc-configuration-service`);
  }

  /**
   * Get keys of configurations stored in Consul
   * @param {String} prefix - prefix to filter the keys
   * @param {boolean} [recurse=false] - whether to recurse into subdirectories
   * @returns {Promise<Array<string>>} names of configurations which are valid JSON
   */
  async retrieveKeysOfValidConfigurations(prefix, recurse = false) {
    const data = await this._consulService.getOnlyRawValuesByKeyPrefix(prefix);
    return this.filterConfigurations(data, recurse, prefix);
  }

  /**
   * Get configuration by key from Consul
   * @param {string} key - the key of the configuration
   * @returns {Promise<string>} - the raw value stored for the requested key
   */
  async retrieveConfigurationByKey(key) {
    return await this._consulService.getOnlyRawValueByKey(key);
  }


  /**
   * Filters a configuration object and returns keys of entries with valid JSON values.
   * @param {object} configs - an object with string values to be checked.
   * @param {boolean} recurse - whether to recurse into subdirectories
   * @param {string} prefix - the prefix to filter keys
   * @returns {Array<string>} names of configurations which are valid JSON
   */
  filterConfigurations(configs, recurse, prefix) {
    const parsedData = [];
    Object.entries(configs || {}).forEach(([key, value]) => {
      try {
        if (!recurse && key.replace(`${prefix}/`, '').includes('/')) {
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

  /**
   * Get configuration restrictions by key from Consul
   * @param {string} key - the key of the configuration
   * @returns {Promise<Restrictions>}
   */
  async getConfigurationRestrictionsByKey(key) {
    const configuration = await this._consulService.getOnlyRawValueByKey(key);
    return QCConfigurationAdapter.computeObjectRestrictions(configuration);
  }
  
  /**
   * Edit configuration by key in Consul
   * @param {string} key - the key of the configuration
   * @param {string} value - the configuration
   * @returns {Promise<Object>} - JSON object with the status of the transaction
   */
  async editConfigurationByKey(key, value) {
    const listOfConfigurationsToEdit = [{ [key]: JSON.stringify(value, null, 2) }];
    return await this._consulService.putListOfKeyValues(listOfConfigurationsToEdit);
  }
}

exports.QCConfigurationService = QCConfigurationService;
