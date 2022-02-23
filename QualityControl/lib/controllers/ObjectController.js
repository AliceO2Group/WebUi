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

const assert = require('assert');
const {errorHandler} = require('../utils.js');

/**
 * Gateway for all QC Objects requests
 */
class ObjectController {
  /**
   * Setup Object Controller:
   * - CcdbService - retrieve data about objects
   * @param {CcdbServices} db
   */
  constructor(db) {
    assert(db, 'Missing service for retrieving objects data');
    this.db = db;
  }

  /**
   * Build Object Data response based on passed object path
   * @param {Req} req - must contain object path
   * @param {Res} res
   */
  async getObjectInfo(req, res) {
    const path = req.query?.path;
    const timestamp = req.query?.timestamp;
    try {
      const info = await this.db.getObjectLatestVersionByPath(path, timestamp);
      const timestamps = await this.db.getObjectTimestampList(path, timestamp);
      res.status(200).json({info, timestamps});
    } catch (error) {
      errorHandler(error, 'Failed to load data for object', res, 502, 'object');
    }
  }
}

module.exports = ObjectController;
