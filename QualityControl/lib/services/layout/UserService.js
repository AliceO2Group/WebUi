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

import { InvalidInputError, LogManager, NotFoundError } from '@aliceo2/web-ui';
import { UniqueConstraintError } from 'sequelize';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/user-svc`;

/**
 * Class that handles the business logic for the users
 */
export class UserService {
  /**
   * Creates an instance of the UserService class
   * @param {BaseRepository} userRepository Repository that handles the datbase operations for the users
   */
  constructor(userRepository) {
    this._logger = LogManager.getLogger(LOG_FACILITY);
    this._userRepository = userRepository;
  }

  /**
   * Creates a new user
   * @param {Partial<UserAttributes>} userData - Data for the new user
   * @param user
   * @throws {InvalidInputError} If a user with the same unique fields already exists
   * @returns {Promise<void>}
   */
  async createNewUser(user) {
    const { username, name, personid } = user;
    try {
      const existingUser = await this._userRepository.findUser({
        username: username,
        name: name,
      });

      if (!existingUser || existingUser.length === 0) {
        const newUser = {
          id: personid,
          username: username,
          name: name,
        };
        await this._userRepository.createUser(newUser);
      }
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const field = error.errors?.[0]?.path || 'username';
        throw new InvalidInputError(`A user with the same ${field} already exists.`);
      }
      this._logger.errorMessage(`Error creating user: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Retrieves a user bi his username
   * @param {string} id id of the owner of the layout
   * @returns {string} the owner's username
   * @throws {NotFoundError} null if user was not found
   */
  async getUsernameById(id) {
    try {
      const user = await this._userRepository.findUser({ id });
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      return user.username;
    } catch (error) {
      this._logger.errorMessage(`Error fetching username by ID: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Retrieves a user id by his username
   * @param {string} username the username of the owner
   * @returns {string} the owner's id
   * @throws {NotFoundError} if user was not found
   */
  async getOwnerIdByUsername(username) {
    try {
      const user = await this._userRepository.findUser({ username });
      if (!user) {
        throw new NotFoundError(`User with username ${username} not found`);
      }
      return user.id;
    } catch (error) {
      this._logger.errorMessage(`Error fetching owner ID by username: ${error.message || error}`);
      throw error;
    }
  }
}
