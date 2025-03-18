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

const { LogManager, updateAndSendExpressResponseFromNativeError } = require('@aliceo2/web-ui');

/**
 * Controller class for providing configuration for the InfoLogger optional services
 * @class
 */
class ConfigController {
  /**
   * Constructor for the ConfigController
   * @param {object} config - configuration object loaded at the start of the application.
   */
  constructor(config) {
    this._config = config ?? {};
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/config-ctrl`);
  }

  /**
   * Handler for providing configuration for the InfoLogger optional services
   * @param {ExpressJS.Request} _ - object for the HTTP request.
   * @param {ExpressJS.Response} res - response with the configuration object
   * @returns {*} response returned.
   */
  async getConfigurationHandler(_, res) {
    try {
      const bookkeepingUrl = this._config?.bookkeeping?.url ?? '';
      return res.status(200).json({
        bookkeeping: {
          url: bookkeepingUrl,
        },
      });
    } catch (error) {
      this._logger.errorMessage(error.toString());
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }
};

exports.ConfigController = ConfigController;
