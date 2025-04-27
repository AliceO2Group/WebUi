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
import { updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';

/**
 * @typedef {import('../services/UserService.js').UserService} UserService
 */

/**
 * Gateway for all User data calls
 */
export class UserController {
/**
 * Creates an instance of UserController.
 * @param {UserService} userService - An instance of UserService to interact with user data.
 * @throws {Error} Throws an error if the UserService is not provided.
 */
  constructor(userService) {
    assert(userService, 'Missing User Service');

    /**
     * User repository for interacting with user data.
     * @type {UserRepository}
     * @private
     */
    this._userService = userService;
  }

  /**
   * Given a user, save it in DB
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async addUserHandler(req, res) {
    try {
      await this._userService.createUser(req.session);
      res.status(201).json({ ok: true });
    } catch (err) {
      updateAndSendExpressResponseFromNativeError(res, err);
    }
  }
}
