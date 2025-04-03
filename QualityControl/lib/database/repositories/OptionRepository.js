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

import { BaseRepository } from './BaseRepository.js';

/**
 * Repository class for managing Option entities.
 */
export class OptionRepository extends BaseRepository {
  /**
   * Creates an instance of OptionRepository.
   * @param {object} optionModel - The Sequelize model for options.
   */
  constructor(optionModel) {
    super(optionModel);
  }

  /**
   * Retrieves all options from the database.
   * @returns {Promise<Array>} A promise that resolves to an array of option objects.
   * @throws {Error} If the retrieval fails.
   */
  async findAll() {
    try {
      return await this._model.findAll();
    } catch (error) {
      this._logger.errorMessage(`Error retrieving all options: ${error.message}`);
      throw new Error('Failed to retrieve options');
    }
  }
}
