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
 * Repository for managing chart options.
 * @augments BaseRepository
 */
export class ChartOptionsRepository extends BaseRepository {
  /**
   * Creates an instance of ChartOptionsRepository.
   * @param {ChartOptionModel} chartOptionModel - The model for chart options.
   */
  constructor(chartOptionModel) {
    super(chartOptionModel);
  }

  /**
   * Creates a new chart option.
   * @param {object} chartOptionData - The data for the new chart option.
   * @returns {Promise<ChartOption>} - A promise that resolves to the created chart option.
   * @throws {Error} - Throws an error if there is an issue during the creation.
   */
  async createChartOption(chartOptionData) {
    const [createdRows] = await this._model.create(chartOptionData);
    if (createdRows === 0) {
      throw new Error('Error creating chart option');
    }
  }

  /**
   * Finds the options for a specific chart by its ID.
   * @param {number} chartId - The ID of the chart.
   * @returns {Promise<Array<Option>>} - A promise that resolves to an array of options.
   * @throws {Error} - Throws an error if no options are found or if there is an issue during the search.
   */
  async findChartOptionsByChartId(chartId) {
    return await this._model.findAll({
      where: { chart_id: chartId },
    });
  }

  /**
   * Deletes a chart option from the database.
   * @param {string} chartId - The ID of the chart.
   * @param {number} optionId - The ID of the option to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   * @throws {Error} If the deletion fails.
   */

  async deleteChartOption(chartId, optionId) {
    const deletedRows = await this._model.destroy({
      where: { chart_id: chartId, option_id: optionId },
    });
    if (deletedRows === 0) {
      throw new Error('Error deleting chart option');
    }
  }

  /**
   * Updates a chart option.
   * @param {ChartOption} chartOption Chart option to update including chartId and optionId
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   * @throws {Error} If the update fails.
   */
  async updateChartOption(chartOption) {
    const { chartId, optionId } = chartOption;
    const [updatedRows] = await this._model.update(
      {
        chart_id: chartId,
        option_id: optionId,
      },
      {
        where: { chart_id: chartId, option_id: optionId },
        include: [
          {
            association: 'option',

          },
        ],
      },
    );
    if (updatedRows === 0) {
      throw new Error('Error updating chart option');
    }
  }
}
