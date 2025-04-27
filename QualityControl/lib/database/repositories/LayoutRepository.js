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
   * @throws {Error} Throws an error if the layout is not found or if a database error occurs.
   */
  async findLayoutById(layoutId) {
    try {
      const layout = await this._model.findOne({
        where: { id: layoutId },
        include: this._layoutInfoToInclude,
      });
      if (!layout) {
        throw new Error('Layout not found');
      }
      return layout;
    } catch (error) {
      this._logger.errorMessage(`Error finding layout by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves all layouts from the database that match the specified filters.
   * @async
   * @param {object} filters - An object containing the filtering criteria for querying layouts.
   * @returns {Promise<Array>} A promise that resolves to an array of layout objects.
   * @throws {Error} Throws an error if no layouts matching the criteria are found or if a database error occurs.
   */

  async findAllLayouts(filters) {
    try {
      if (!filters || Object.keys(filters).length === 0) {
        return this._model.findAll({
          include: this._layoutInfoToInclude,
        });
      } const layoutsFound = await this._model.findAll({
        where: { [Op.and]: [filters] },
        include: this._layoutInfoToInclude,
      });
      return layoutsFound;
    } catch (error) {
      this._logger.errorMessage(`Error finding layouts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a layout by its name from the database.
   * @param {string} layoutName - The name of the layout to retrieve.
   * @returns {Promise<object>} A promise that resolves to the layout object if found.
   * @throws {Error} Throws an error if the layout is not found or if a database error occurs.
   */
  async findLayoutByName(layoutName) {
    try {
      const layoutFound =
        await this._model.findOne({ where: { name: layoutName }, include: this._layoutInfoToInclude });
      if (!layoutFound) {
        throw new Error(`Layout with name ${layoutName} not found`);
      }
      return layoutFound;
    } catch (error) {
      this._logger.errorMessage(`Error getting layout by name: ${error.message}`);
      throw error;
    }
  }

  /**
   * Saves a layout to the database.
   * @param {object} layoutData - The data of the layout to be saved.
   * @returns {Promise<Layout>} A promise that resolves to the created layout object.
   * @throws {Error} if error during creation
   */
  async createLayout(layoutData) {
    try {
      return await this._model.create(layoutData);
    } catch (error) {
      this._logger.errorMessage(`Error creating layout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates a layout.
   * @param {number} layoutId - The ID of the layout.
   * @param {GridTabCell} updateData - The data to update the layout with.
   * @returns {Promise<number>} - A promise that resolves with 1 if layout has been updated successfully.
   * @throws {Error} - Throws an error if there is an issue during the update.
   */
  async updateLayout(layoutId, updateData) {
    try {
      const [affectedRows] = await this._model.update(updateData, {
        where: { id: layoutId },
      });
      if (affectedRows === 0) {
        throw new Error('Layout not found or no changes made');
      }
      return affectedRows;
    } catch (error) {
      this._logger.errorMessage(`Error updating layout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a layout.
   * @param {number} layoutId - The ID of the layout.
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   * @throws {Error} - Throws an error if there is an issue during the deletion.
   */
  async deleteLayout(layoutId) {
    try {
      const deletedRows = await this._model.destroy({
        where: { id: layoutId },
      });
      if (deletedRows === 0) {
        throw new Error('Layout not found');
      }
    } catch (error) {
      this._logger.errorMessage(`Error deleting layout: ${error.message}`);
      throw error;
    }
  }
}
