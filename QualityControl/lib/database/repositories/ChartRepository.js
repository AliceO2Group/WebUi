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
 * Repository for managing charts.
 * @augments BaseRepository
 */
export class ChartRepository extends BaseRepository {
  /**
   * Creates an instance of ChartRepository.
   * @param {ChartModel} chartModel - The model for chart options.
   */
  constructor(chartModel) {
    super(chartModel);
  }

  /**
   * Finds a chart by its ID.
   * @param {number} chartId - The ID of the chart.
   * @returns {Promise<Chart>} - A promise that resolves to the found chart.
   * @throws {Error} - Throws an error if the chart is not found or if there is an issue during the search.
   */
  async findChartById(chartId) {
    return await this._model.findByPk(chartId);
  }

  /**
   * Creates a new chart.
   * @param {object} chartData - The data for the new chart.
   * @returns {Promise<Chart>} - A promise that resolves to the created chart.
   * @throws {Error} - Throws an error if there is an issue during the creation.
   */
  async createChart(chartData) {
    const [createdRows] = await this._model.create(chartData);
    if (createdRows === 0) {
      throw new Error('Error creating chart');
    }
  }

  /**
   * Updates a chart.
   * @param {string} chartID - The ID of the chart to update
   * @param {object} updateData - The data to update the chart with.
   * @throws {Error} - Throws an error if there is an issue during the update.
   */
  async updateChart(chartID, updateData) {
    const [affectedRows] = await this._model.update(
      updateData,
      {
        where: { id: chartID },
      },
    );
    if (affectedRows === 0) {
      throw new Error('Error updating chart');
    }
  }

  /**
   * Deletes a chart.
   * @param {number} chartId - The ID of the chart to delete.
   * @throws {Error} - Throws an error if there is an issue during the deletion.
   */
  async deleteChart(chartId) {
    const deletedRows = await this._model.destroy({
      where: { id: chartId },
    });
    if (deletedRows === 0) {
      throw new Error('Error deleting chart');
    }
  }
}
