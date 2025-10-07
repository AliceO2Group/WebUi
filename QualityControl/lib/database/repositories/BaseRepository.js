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
  }

  /**
   * The Sequelize model associated with this repository.
   * @returns {Model} the Sequelize model
   */
  get model() {
    return this._model;
  }
}
