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

const { NotFoundError, ServiceUnavailableError, LogManager } = require("@aliceo2/web-ui");
const { errorHandler } = require("../utils.js");

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
   * Initialize Lock service based on the provided list of detectors
   * @param {Array<String>} detectors = [] - list of detectors to be used for the lock mechanism
   * @return {void}
   */
  // setLockStatesForDetectors(detectors = []) {
  //   for (const detectorName of detectors) {
  //     this._locksByDetector[detectorName] = new DetectorLock(detectorName);
  //   }
  // }

  /**
   * Check if consulService is present:
   * * If yes, allow request to continue
   * * If not, send response accordingly
   * @param {Request} req
   * @param {Response} res
   * @param {Next} next
   */
  validateService(req, res, next) {
    if (this._consulService) {
      next();
    } else {
      errorHandler("Unable to retrieve configuration of consul service", res, 502);
    }
  }

  /**
   * Method to check if consul service can be used
   */
  async testConsulStatus() {
    this._consulService
      .getConsulLeaderStatus()
      .then((data) => this._logger.info(`Service is up and running on: ${data}`))
      .catch((error) => this._logger.error(`Connection failed due to ${error}`));
  }

  /**
   * Get keys of configurations stored in Consul
   * @param {String} prefix - prefix to filter the keys
   * @param {boolean} [recurse=false] - whether to recurse into subdirectories
   */
  async getKeysOfValidConfigurations(prefix, recurse = false) {
    try {
      const data = await this._consulService.getOnlyRawValuesByKeyPrefix(prefix);
      const parsedData = [];

      Object.entries(data || {}).forEach(([key, value]) => {
        try {
          if (!JSON.parse(value)) {
            return;
          }
          if (!recurse && key.replace(`${prefix}/`, "").includes("/")) {
            return;
          }

          parsedData.push(key);
        } catch (e) {
          // skip
        }
      });

      return parsedData;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(`No configurations found for prefix: ${prefix}`);
      }
      throw error;
    }
  }

  /**
   * Get configuration by key from Consul
   * @param {String} key - the key of the configuration
   */
  async getConfigurationByKey(key) {
    try {
      const value = await this._consulService.getOnlyRawValueByKey(key);
      if (!value) {
        throw new NotFoundError(`Configuration not found for key: ${key}`);
      }
      return value;
    } catch (error) {
      throw new ServiceUnavailableError(`Error retrieving configuration for key: ${key}`);
    }
  }
}

exports.QCConfigurationService = QCConfigurationService;
