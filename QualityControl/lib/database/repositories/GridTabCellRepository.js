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

import { BaseRepository } from './BaseRepository.js';

/**
 * Grid Tab Cell Repository class to handle CRUD operations for Grid Tab Cells.
 */
export class GridTabCellRepository extends BaseRepository {
  /**
   * Creates an instance of GridTabCellRepository.
   * @param {GridTabCellModel} gridTabCellModel - The model for grid tab cell.
   */
  constructor(gridTabCellModel) {
    super(gridTabCellModel);
  }

  /**
   * Finds grid tab cells by tab ID.
   * @param {number} tabId - The ID of the tab.
   * @returns {Promise<Array<GridTabCell>>} - A promise that resolves to an array of grid tab cells.
   */
  async findByTabId(tabId) {
    return await this._model.findAll({
      where: { tab_id: tabId },
    });
  }

  /**
   * Finds grid tab cells by chart ID.
   * @param {number} chartId - The ID of the chart.
   * @returns {Promise<Array<GridTabCell>>} - A promise that resolves to an array of grid tab cells.
   */
  async findByChartId(chartId) {
    return await this._model.findAll({
      where: { chart_id: chartId },
    });
  }

  /**
   * Creates a new grid tab cell.
   * @param {object} newGridTabCell - The data for the new grid tab cell.
   * @returns {Promise<GridTabCell>} - A promise that resolves to the created grid tab cell.
   * @throws {Error} - Throws an error if there is an issue during the creation.
   */
  async createGridTabCell(newGridTabCell) {
    const [createdRows] = await this._model.create(newGridTabCell);
    if (createdRows === 0) {
      throw new Error('Grid tab cell creation failed');
    }
  }

  /**
   * Deletes a grid tab cell.
   * @param {number} chartId - The ID of the chart.
   * @param {number} tabId - The ID of the tab.
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   * @throws {Error} - Throws an error if there is an issue during the deletion.
   */
  async deleteGridTabCell(chartId, tabId) {
    const deletedRows = await this._model.destroy({
      where: { chart_id: chartId, tab_id: tabId },
    });
    if (deletedRows === 0) {
      throw new Error('Grid tab cell not found');
    }
  }

  /**
   * Updates a grid tab cell.
   * @param {object} identifier - An object containing chartId and tabId.
   * @param {string} identifier.chart_id - The ID of the chart.
   * @param {string} identifier.tab_id - The ID of the tab.
   * @param {GridTabCell} newGridTabCell - The data to update the grid tab cell with.
   * @returns {Promise<number>} - A promise that resolves with 1 if cell has been updated successfully.
   * @throws {Error} - Throws an error if there is an issue during the update.
   */
  async updateGridTabCell(identifier, newGridTabCell) {
    const { chart_id, tab_id } = identifier;
    const [updatedRows] = await this._model.update(
      newGridTabCell,
      {
        where: { chart_id, tab_id },
      },
    );
    if (updatedRows === 0) {
      throw new Error('Grid tab cell not found or no changes made');
    }
    return updatedRows;
  }

  /**
   * Finds an object by the chart ID.
   * @param {string} chartId - The ID of the chart.
   * @returns {Promise<object>} - A promise that resolves with the found object.
   * @throws {Error} - Throws an error if the object cannot be found.
   */
  async findObjectByChartId(chartId) {
    return await this._model.findOne({
      where: { chart_id: chartId },
      include: [
        {
          association: 'tab',
          include: [
            {
              association: 'layout',
              attributes: ['name'],
            },
          ],
          attributes: ['name'],
        },
        {
          association: 'chart',
          attributes: ['object_name', 'ignore_defaults'],
          include: [
            {
              association: 'chartOptions',
              include: [
                {
                  association: 'option',
                  attributes: ['name'],
                },
              ],
            },
          ],
        },
      ],
      attributes: [],
    });
  }
}
