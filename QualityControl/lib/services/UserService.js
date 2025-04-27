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

import { InvalidInputError } from '@aliceo2/web-ui';

/**
 * Service class for managing users.
 */
export class UserService {
  /**
   * Creates an instance of UserService.
   * @param {UserRepository} userRepository - The user repository instance.
   * @throws {Error} Throws an Error if the userRepository is not provided or is not an instance of UserRepository.
   */
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error('Missing User Repository');
    }
    this._userRepository = userRepository;
  }

  /**
   * Retrieves a user by their username and converts it to JSON.
   * @async
   * @param {string} username - The username of the user to retrieve.
   * @returns {Promise<User|null>} A promise that resolves to the user object as JSON, or null if not found.
   * @throws {Error} Throws a Error if an error occurs during retrieval.
   */
  async getUserByUsername(username) {
    try {
      const user = await this._userRepository.findUserByUsername(username);
      if (!user) {
        return null;
      }
      return user.toJSON();
    } catch (error) {
      throw new Error(`Error getting user by username: ${error.message}`);
    }
  }

  /**
   * Retrieves a user by their ID and converts it to JSON.
   * @async
   * @param {string|number} id - The ID of the user to retrieve.
   * @returns {Promise<object|null>} A promise that resolves to the user object as JSON, or null if not found.
   * @throws {Error} Throws an Error if an error occurs during retrieval.
   */
  async getUserById(id) {
    try {
      const user = await this._userRepository.findUserById(id);
      if (!user) {
        return null;
      }
      return user.toJSON();
    } catch (error) {
      throw new Error(`Error getting user by ID: ${error.message}`);
    }
  }

  /**
   * Creates a new user after validating the data.
   * @param {object} sessionInfo - The session information containing user data.
   * @throws {Error} If validation fails or the user already exists.
   */
  async createUser(sessionInfo) {
    this._validateUser(sessionInfo);
    const existingUser = await this._userRepository.findUser({
      username: sessionInfo.username,
      name: sessionInfo.name,
    });

    if (!existingUser || existingUser.length === 0) {
      const newUser = {
        id: sessionInfo.personid,
        username: sessionInfo.username,
        name: sessionInfo.name,
      };
      await this._userRepository.createUser(newUser);
    }
  }

  /**
   * Validates user data before creation.
   * @param {object} sessionInfo - The session information containing user data.
   * @throws {Error} If validation fails.
   */
  _validateUser(sessionInfo) {
    if (!sessionInfo) {
      throw new InvalidInputError('sessionInfo must be provided');
    }
    if (!sessionInfo.username) {
      throw new InvalidInputError('Field "username" is mandatory.');
    }
    if (!sessionInfo.name) {
      throw new InvalidInputError('name of the user is mandatory');
    }
    if (sessionInfo.personid === null || sessionInfo.personid === undefined || sessionInfo.id === '') {
      throw new InvalidInputError('id of the user is mandatory');
    }
    if (isNaN(sessionInfo.personid)) {
      throw new InvalidInputError('id of the user must be a number');
    }
  }
}
