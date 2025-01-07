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

const config = require('../configProvider.js');

class ConfigController {
  /**
   * Return Bookkeeping URL to frontend.
   * @param {*} req incoming request.
   * @param {*} res response with the Bookkeeping URl.
   * @returns {*} response returned.
   */
  async getBKPUrl(req, res) {
    try {
      const BKPUrl = config.bookkeeping.url ?? '';
      return res.status(200).json(BKPUrl);
    } catch (error) {
      this._logger.errorMessage(error.toString());
      return res.status(400);
    }
  }
};

exports.ConfigController = ConfigController;
