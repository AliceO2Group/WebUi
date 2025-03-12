/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import assert from 'assert';

/**
 * @typedef {import('../services/JsonFileService.js').JsonFileService} JsonFileService
 */

/**
 * UserRepository class to handle CRUD operations for Users.
 */
export default class UserRepository {
  /**
   * Initializes the User Repository.
   * @param {JsonFileService} jsonFileService - Service to interact with the JSON database.
   * @throws {Error} Throws an error if jsonFileService is not provided.
   */
  constructor(jsonFileService) {
    assert(jsonFileService, 'Missing service for retrieving layout data');

    /**
     * JSON service to handle data storage.
     * @type {JsonFileService}
     * @private
     */
    this._jsonFileService = jsonFileService;
  }

  /**
   * Check if a user is saved and if not, add it to the in-memory list and db.
   * @param {object} user - Data of the user to be added.
   * @returns {Promise<void>}
   */
  async createUser(user) {
    const { data } = this._jsonFileService;
    this._validateUser(user);

    const isUserPresent = data.users.some((userEl) => user.id === userEl.id && user.name === userEl.name);

    if (!isUserPresent) {
      data.users.push(user);
      await this._jsonFileService.writeToFile();
    }
  }

  /**
   * Validate that a user JSON contains all the mandatory fields
   * @param {JSON} user - data of the user to be added
   * @returns {undefined}
   * @throws {Error}
   */
  _validateUser(user) {
    if (!user) {
      throw new Error('User Object is mandatory');
    }
    if (!user.username) {
      throw new Error('Field username is mandatory');
    }
    if (!user.name) {
      throw new Error('Field name is mandatory');
    }
    if (user.id === null || user.id === undefined || user.id === '') {
      throw new Error('Field id is mandatory');
    }
    if (isNaN(user.id)) {
      throw new Error('Field id must be a number');
    }
  }
}
