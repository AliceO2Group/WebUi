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

import { Op } from 'sequelize';
import { LogManager } from '@aliceo2/web-ui';

/**
 * BaseRepository serves as a generic repository class for managing a specific model.
 */
export class BaseRepository {
  /**
   * Initializes a new instance of the repository with the specified model.
   * @param {object} model - The Sequelize model to be used by the repository.
   */

  constructor(model) {
    this._model = model;
    this._logger = LogManager.getLogger(`qcg/${process.env.NODE_ENV === 'test' ? 'test/' : ''}repository`);
  }

  /**
   * Finds a record in the database by its unique identifier.
   * @param {string|number} id - The unique identifier of the record to find.
   * @returns {Promise<object|null>} A promise that resolves to the found record or null if not found.
   * @throws {Error} If the query fails.
   */
  async findById(id) {
    try {
      const record = await this._model.findByPk(id);
      return record;
    } catch (error) {
      this._logger.errorMessage(`Error fetching record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finds all records in the database that match the provided filters.
   * @param {object} filters - The filters to apply to the query.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of records that match the filters.
   * @throws {Error} If the query fails.
   */
  async findAllByFilters(filters = {}) {
    try {
      const results = await this._model.findAll({
        where: { [Op.and]: [filters] },
      });
      return results || [];
    } catch (error) {
      this._logger.errorMessage(`Error fetching records: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a new record in the database.
   * @param {object} createData - The data to create the record with.
   * @returns {Promise<object>} A promise that resolves to the created record.
   * @throws {Error} If the creation fails.
   */
  async create(createData) {
    try {
      const newRecord = await this._model.create(createData);
      return newRecord;
    } catch (error) {
      this._logger.errorMessage(`Error creating record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates a record in the database by its unique identifier.
   * @param {string|number} id - The unique identifier of the record to update.
   * @param {object} updateData - The data to update the record with.
   * @returns {number} Number of updated registers
   * @throws {Error} If the update fails.
   */
  async update(id, updateData) {
    try {
      const [affectedRows] = await this._model.update(updateData, {
        where: { id: id },
      });
      return affectedRows;
    } catch (error) {
      this._logger.errorMessage(`Error updating record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a record from the database by its unique identifier.
   * @param {string|number} id - The unique identifier of the record to delete.
   * @returns {number} Number of deleted registers
   * @throws {Error} If the deletion fails.
   */
  async delete(id) {
    try {
      const deletedRows = await this._model.destroy({
        where: { id: id },
      });
      return deletedRows;
    } catch (error) {
      this._logger.errorMessage(`Error deleting record: ${error.message}`);
      throw error;
    }
  }
}
