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

/** @typedef {import('sequelize').Model} Model */

/**
 * Parent class for repositories
 */
export class BaseRepository {
  /**
   * Creates an instance of the BaseRepository class
   * @param {Model} model Sequelize model to be used by the repository
   * @throws {Error} Throws an error if model is not provided.
   */
  constructor(model) {
    if (!model) {
      throw new Error('A Sequelize model must be provided to BaseRepository.');
    }
    this._model = model;
    this._defaultInclude = [];
  }

  /**
   * The Sequelize model associated with this repository.
   * @returns {Model} the Sequelize model
   */
  get model() {
    return this._model;
  }

  /**
   * The default include options for Sequelize queries.
   * @returns {Array} the default include options
   */
  get defaultInclude() {
    return this._defaultInclude;
  }

  /**
   * Sets the default include options for Sequelize queries.
   * @param {Array} include - The include options to set as default
   */
  set defaultInclude(include) {
    this._defaultInclude = include;
  }

  /**
   * Finds a record by its primary key.
   * @param {number} id - The primary key of the record to find.
   * @param {object} [options={}] - Additional options for the query.
   * @returns {Promise<Model|null>} A promise that resolves to the found record or null if not found.
   */
  async findById(id, options = {}) {
    return this._model.findByPk(id, { include: this._defaultInclude, ...options });
  }

  /**
   * Finds a single record that matches the given constraints.
   * @param {object} [constraints={}] - Constraints to filter the records.
   * @param {object} [options={}] - Additional options for the query.
   * @returns {Promise<Model|null>} A promise that resolves to the found record or null if not found.
   */
  async findOne(constraints = {}, options = {}) {
    return this._model.findOne({ where: constraints, include: this._defaultInclude, ...options });
  }

  /**
   * Finds all records that match the given options.
   * @param {object} [constraints={}] - Constraints to filter the records.
   * @param {object} [options={}] - Options for filtering, sorting, and including related models.
   * @returns {Promise<Model[]>} A promise that resolves to an array of found records.
   */
  async findAll(options = {}) {
    return this._model.findAll({ include: this._defaultInclude, ...options });
  }

  /**
   * Creates a new record in the database.
   * @param {object} item - The data for the new record.
   * @param {object} [options={}] - Additional options for the creation.
   * @returns {Promise<Model>} A promise that resolves to the created record.
   */
  async create(item, options = {}) {
    return this._model.create(item, { ...options });
  }

  /**
   * Updates an existing record in the database.
   * @param {number} id - The primary key of the record to update.
   * @param {object} updateData - The data to update the record with.
   * @param {object} [options={}] - Additional options for the update.
   * @returns {Promise<number>} A promise that resolves to the number of records updated.
   */
  async update(id, updateData, options = {}) {
    return this._model.update(updateData, { where: { id }, ...options });
  }

  /**
   * Deletes a record from the database.
   * @param {number} id - The primary key of the record to delete.
   * @param {object} [options={}] - Additional options for the deletion.
   * @returns {Promise<number>} A promise that resolves to the number of records deleted.
   */
  async delete(id, options = {}) {
    return this._model.destroy({ where: { id }, ...options });
  }
}
