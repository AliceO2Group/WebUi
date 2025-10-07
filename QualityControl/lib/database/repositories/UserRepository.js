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

import { UniqueConstraintError } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import { InvalidInputError } from '@aliceo2/web-ui';

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
   * Creates a new user
   * @param {object} userData - Data of the user to be added.
   * @param {object} options - Sequelize options (e.g., transaction)
   * @returns {Promise<object>} The created user
   */
  async createUser(userData, options = {}) {
    try {
      const createdUser = await super.create(userData, options);
      return createdUser;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const field = error.errors?.[0]?.path || 'username';
        throw new InvalidInputError(`A user with the same ${field} already exists.`);
      }
    }
  }
}
