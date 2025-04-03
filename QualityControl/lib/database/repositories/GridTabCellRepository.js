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
   * @throws {Error} - Throws an error if there is an issue during the search.
   */
  async findByTabId(tabId) {
    try {
      const filters = { tab_id: tabId };
      const gridTabCells = await this.findAllByFilters(filters);
      return gridTabCells;
    } catch (error) {
      this._logger.errorMessage(`Error finding grid tab cells by tab ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finds grid tab cells by chart ID.
   * @param {number} chartId - The ID of the chart.
   * @returns {Promise<Array<GridTabCell>>} - A promise that resolves to an array of grid tab cells.
   * @throws {Error} - Throws an error if there is an issue during the search.
   */
  async findByChartId(chartId) {
    try {
      const filters = { chart_id: chartId };
      const gridTabCells = await this.findAllByFilters(filters);
      return gridTabCells;
    } catch (error) {
      this._logger.errorMessage(`Error finding grid tab cells by chart ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a new grid tab cell.
   * @param {object} newGridTabCell - The data for the new grid tab cell.
   * @returns {Promise<GridTabCell>} - A promise that resolves to the created grid tab cell.
   * @throws {Error} - Throws an error if there is an issue during the creation.
   */
  async createGridTabCell(newGridTabCell) {
    try {
      const createdGridTabCell = await this.create(newGridTabCell);
      return createdGridTabCell;
    } catch (error) {
      this._logger.errorMessage(`Error creating grid tab cell: ${error.message}`);
      throw error;
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
    try {
      const deletedRows = await this._model.destroy({
        where: { chart_id: chartId, tab_id: tabId },
      });
      if (deletedRows === 0) {
        throw new Error('Grid tab cell not found');
      }
    } catch (error) {
      this._logger.errorMessage(`Error deleting grid tab cell: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates a grid tab cell.
   * @param {number} chartId - The ID of the chart.
   * @param {GridTabCell} newGridTabCell - The data to update the grid tab cell with.
   * @returns {Promise<number>} - A promise that resolves with 1 if cell has been updated successfully.
   * @throws {Error} - Throws an error if there is an issue during the update.
   */
  async updateGridTabCell(chartId, newGridTabCell) {
    try {
      const affectedRows = await this.update({ chart_id: chartId, tab_id: newGridTabCell.tab_id }, newGridTabCell);
      if (affectedRows === 0) {
        throw new Error('Grid tab cell not found or no changes made');
      }
      return affectedRows;
    } catch (error) {
      this._logger.errorMessage(`Error updating grid tab cell: ${error.message}`);
      throw error;
    }
  }
}
