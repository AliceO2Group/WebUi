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

import assert from 'assert';
import { LogLevel, LogManager } from '@aliceo2/web-ui';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/user-controller`;

/**
 * @typedef {import('../repositories/UserRepository.js').UserRepository} UserRepository
 */

/**
 * Gateway for all User data calls
 */
export class UserController {
/**
 * Creates an instance of UserController.
 * @param {UserRepository} userRepository - An instance of UserRepository to interact with user data.
 * @throws {Error} Throws an error if the UserRepository is not provided.
 */
  constructor(userRepository) {
    assert(userRepository, 'Missing User Repository');
    this._logger = LogManager.getLogger(LOG_FACILITY);

    /**
     * User repository for interacting with user data.
     * @type {UserRepository}
     * @private
     */
    this._userRepository = userRepository;
  }

  /**
   * Given a user, save it in DB
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async addUserHandler(req, res) {
    const { personid: id, name, username } = req.session;

    try {
      this._validateUser(username, name, id);
      await this._userRepository.createUser({ id, name, username });
      res.status(200).json({ ok: true });
    } catch (err) {
      if (err.stack) {
        this._logger.trace(err);
      }
      this._logger.errorMessage('Unable to add user to memory', {
        level: LogLevel.SUPPORT,
      });
      res.status(502).json({ ok: false, message: 'Unable to add user to memory' });
    }
  }

  /**
   * Validate that user's parameters contains all the mandatory fields
   * @param {string} username - expected username
   * @param {string} name - expected name of the user
   * @param {number} id - cernid of the user
   * @returns {undefined}
   * @throws {Error}
   */
  _validateUser(username, name, id) {
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
