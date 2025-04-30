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

import { BaseRepository } from './BaseRepository.js';

/**
 * UserRepository class to handle CRUD operations for Users.
 */
export class UserRepository extends BaseRepository {
  constructor(model) {
    super(model);
  }

  /**
   * Retrieves a user by their username.
   * @param {string} username - The username of the user to retrieve.
   * @returns {Promise<User|null>} A promise that resolves to the user object if found, otherwise null.
   */
  async findUserByUsername(username) {
    return await this._model.findOne({
      where: { username },
    });
  }

  /**
   * Retrieves a user by their ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<User|null>} A promise that resolves to the user object if found, otherwise null.
   */
  async findUserById(userId) {
    return await this._model.findByPk(userId);
  }

  /**
   * Retrieves a user based on given filters.
   * @param {object} filters - An object containing the criteria to search for.
   * @returns {Promise<User|null>} A promise that resolves to the user object if found, otherwise null.
   */
  async findUser(filters) {
    return await this._model.findOne({
      where: filters,
    });
  }

  /**
   * Creates a new user.
   * @param {object} userData - The data of the user to create.
   * @returns {Promise<object>} A promise that resolves to the created user object.
   */
  async createUser(userData) {
    return await this._model.create(userData);
  }
}
