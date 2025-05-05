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
import { BaseRepository } from './BaseRepository.js';

/**
 * LayoutRepository class to handle CRUD operations for Layouts.
 */
export class LayoutRepository extends BaseRepository {
/**
 * Creates an instance of LayoutRepository.
 * @class
 * @param {LayoutModel} layoutModel - The model for layout management.
 */
  constructor(layoutModel) {
    super(layoutModel);
    this._layoutInfoToInclude = [
      {
        association: 'tabs',
        include: [
          {
            association: 'gridTabCells',
            include: [
              {
                association: 'chart',
                include: [
                  {
                    association: 'chartOptions',
                    include: [{ association: 'option' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        association: 'owner',
        attributes: ['id', 'username', 'name'],
      },
    ];
  }

  /**
   * Retrieves a layout by its ID from the database.
   * @param {number|string} layoutId - The ID of the layout to retrieve.
   * @returns {Promise<Layout>} A promise that resolves to the layout object if found.
   */
  async findLayoutById(layoutId) {
    const layout = await this._model.findOne({
      where: { id: layoutId },
      include: this._layoutInfoToInclude,
    });
    return layout;
  }

  /**
   * Retrieves all layouts from the database
   * @returns {Promise<Layout[]>} A promise that resolves to an array of layout objects.
   */
  async findAllLayouts() {
    return this._model.findAll({
      include: this._layoutInfoToInclude,
    });
  }

  /**
   * Retrieves all layouts from the database that match the specified filters.
   * @param {object} filters - An object containing the filtering criteria for querying layouts.
   * @returns {Promise<Layout[]>} A promise that resolves to an array of layout objects.
   */
  async findByFilters(filters) {
    return await this._model.findAll({
      where: { [Op.and]: [filters] },
      include: this._layoutInfoToInclude,
    });
  }

  /**
   * Retrieves a layout by its name from the database.
   * @param {string} layoutName - The name of the layout to retrieve.
   * @returns {Promise<object>} A promise that resolves to the layout object if found.
   * @throws {Error} Throws an error if the layout is not found or if a database error occurs.
   */
  async findLayoutByName(layoutName) {
    return await this._model.findOne({ where: {
      name: layoutName,
    },
    include: this._layoutInfoToInclude,
    });
  }

  /**
   * Saves a layout to the database.
   * @param {object} layoutData - The data of the layout to be saved.
   * @throws {Error} if error during creation
   */
  async createLayout(layoutData) {
    const [createdRows] = await this._model.create(layoutData);
    if (createdRows === 0) {
      throw new Error('Error creating layout');
    }
  }

  /**
   * Updates a layout.
   * @param {number} layoutId - The ID of the layout.
   * @param {Layout} updateData - The data to update the layout with.
   * @throws {Error} if error during update
   */
  async updateLayout(layoutId, updateData) {
    const [updatedRows] = await this._model.update(updateData, {
      where: { id: layoutId },
    });
    if (updatedRows === 0) {
      throw new Error('Error updating layout');
    }
  }

  /**
   * Deletes a layout.
   * @param {number} layoutId - The ID of the layout.
   * @throws {Error} if error during deletion
   */
  async deleteLayout(layoutId) {
    const deletedRows = await this._model.destroy({
      where: { id: layoutId },
    });
    if (deletedRows === 0) {
      throw new Error('Error deleting layout');
    }
  }
}
