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
 * @typedef {object} UserAttributes
 * @property {string} id
 * @property {string} username
 * @property {string} name
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * Repository for managing users.
 */
export class UserRepository extends BaseRepository {
  /**
   * Creates an instance of the UserRepository
   * @param {typeof User} userModel - Sequelize User model
   */
  constructor(userModel) {
    super(userModel);
  }

  /**
   * Retrieves a user based on given filters.
   * @param {object} filters - An object containing the criteria to search for.
   * @returns {Promise<User|null>} A promise that resolves to the user object if found, otherwise null.
   */
  async findUser(filters) {
    return await this.model.findOne({
      where: filters,
    });
  }

  /**
   * Creates a new user
   * @param {Partial<UserAttributes>} userData new user to create
   * @returns {Promise<UserAttributes>} The created user
   */
  async createUser(userData) {
    return this.model.create(userData);
  }
}
