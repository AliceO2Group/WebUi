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

import { LogManager, NotFoundError } from '@aliceo2/web-ui';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/user-svc`;

/**
 * @typedef {import('../../database/repositories/UserRepository.js').UserRepository} UserRepository
 * @typedef {import('../../database/models/User.js').UserAttributes} UserAttributes
 */

/**
 * Class that handles the business logic for the users
 */
export class UserService {
  /**
   * Creates an instance of the UserService class
   * @param {UserRepository} userRepository Repository that handles the datbase operations for the users
   */
  constructor(userRepository) {
    this._logger = LogManager.getLogger(LOG_FACILITY);
    this._userRepository = userRepository;
  }

  /**
   * Creates a new user
   * @param {Partial<UserAttributes>} userData - Data for the new user
   * @param {string} userData.username - Username of the new user
   * @param {string} userData.name - Name of the new user
   * @param {number} userData.personid - Person ID of the new user
   * @throws {InvalidInputError} If a user with the same unique fields already exists
   * @returns {Promise<void>}
   */
  async saveUser(userData) {
    const { username, name, personid } = userData;
    try {
      const existingUser = await this._userRepository.findOne({
        username,
        name,
      });

      if (!existingUser) {
        const userToCreate = {
          id: personid,
          username,
          name,
        };
        const createdUser = await this._userRepository.createUser(userToCreate);
        if (!createdUser) {
          throw new Error('Error creating user');
        }
      }
    } catch (error) {
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
      const user = await this._userRepository.findById(id);
      if (!user || !user.username) {
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
      const user = await this._userRepository.findOne({ username });
      if (!user || !user.id) {
        throw new NotFoundError(`User with username ${username} not found`);
      }
      return user.id;
    } catch (error) {
      this._logger.errorMessage(`Error fetching owner ID by username: ${error.message || error}`);
      throw error;
    }
  }
}
