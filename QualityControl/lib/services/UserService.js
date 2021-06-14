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

const log = new (require('@aliceo2/web-ui').Log)('QualityControl/UserService');
const assert = require('assert');

/**
 * Gateway for all User data calls
 */
class UserService {
  /**
   * Setup User Service
   * @param {JSONFileConnector/SQLDataConnector} dataConnector
   */
  constructor(dataConnector) {
    assert(dataConnector, 'Missing Data Connector');
    this.dataConnector = dataConnector;
  }

  /**
   * Given a user, save it in DB
   * @param {Request} req
   * @param {Response} res
   * @return {boolean}
   */
  async addUser(req, res) {
    const {personid: id, name, username} = req.session;
    // const username = 'anon';
    // const name = 'anon anon';
    // const id = 0;

    try {
      this.validateUser(username, name, id);
      await this.dataConnector.addUser({id, name, username});
      res.status(200).json({ok: true});
    } catch (err) {
      if (err.stack) {
        log.trace(err);
      }
      log.error('Unable to add user to memory');
      res.status(502).json({ok: false, message: 'Unable to add user to memory'})
    }
  }

  /**
   * Validate that user's parameters contains all the mandatory fields
   * @param {string} username
   * @param {string} name
   * @param {number} id
   */
  validateUser(username, name, id) {
    if (!username) {
      throw new Error('username of the user is mandatory');
    }
    if (!name) {
      throw new Error('name of the user is mandatory');
    }
    if (id === null || id === undefined || id === '') {
      throw new Error('id of the user is mandatory');
    }
    if (isNaN(id)) {
      throw new Error('id of the user must be a number');
    }
  }
}

module.exports = UserService;
