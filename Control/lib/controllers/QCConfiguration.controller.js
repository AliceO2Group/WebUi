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

const { LogManager } = require("@aliceo2/web-ui");
const { errorHandler, errorLogger } = require("../utils.js");
const { getConsulConfig } = require("../config/publicConfigProvider.js");

/**
 * Gateway for all Consul Consumer calls
 */
class QCConfigurationController {
  /**
     * Setup QCConfigurationController
     * @param {QCConfigurationService} qcConfigurationService
     * @param {JSON} config
     */
  constructor(qcConfigurationService, config) {
    this._qcConfigurationService = qcConfigurationService;
    this._config = getConsulConfig({ consul: config });
    this._qcConfigurationsPath = `${this._config.qcPath}/ANY/any`;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? "cnf"}/qc-configuration-controller`);
  }

  /**
   * Method to get configurations names
   * @param {Request} req
   * @param {Response} res
   */
  async getConfigurationsKeys(req, res) {
    const { prefix = "", recurse = false } = req.query;
    const prefixPath = prefix ? `${this._qcConfigurationsPath}/${prefix}` : this._qcConfigurationsPath;

    try {
      const parsedData = await this._qcConfigurationService.getKeysOfValidConfigurations(prefixPath, recurse);
      if (!parsedData || parsedData.length === 0) {
        return errorHandler("No configurations found", res, 404);
      }

      res.status(200).json(parsedData);
    } catch (error) {
      errorLogger(error, this._logger);
      errorHandler("Error retrieving configurations", res, 500);
    }
  }

  /**
   * Method to get configuration value by key
   * @param {Request} req
   * @param {Response} res
   */
  async getConfigurationByKey(req, res) {
    const { key } = req.query;
    if (!key) {
      return errorHandler("Missing configuration key", res, 400);
    }

    try {
      const value = await this._qcConfigurationService.getConfigurationByKey(key);
      if (!value) {
        return errorHandler("Configuration not found", res, 404);
      }

      res.status(200).json(value);
    } catch (error) {
      errorLogger(error, this._logger);
      errorHandler("Error retrieving configuration", res, 500);
    }
  }
}

exports.QCConfigurationController = QCConfigurationController;
