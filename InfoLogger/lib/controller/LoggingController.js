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

class LoggingController {
  constructor() {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/query-ctrl`);
  }

  async postReceiveLogs(req, res) {
    try {
      const liveFilter = req.body;
      this._logger.debugMessage(JSON.stringify(liveFilter));
      res.status(200);
    } catch (error) {
      this._logger.errorMessage(error.toString());
      res.status(400);
    }
  }
}

exports.LoggingController = LoggingController;
