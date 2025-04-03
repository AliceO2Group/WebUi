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
   * @param {OptionModel} optionModel - The model for options.
   */
  constructor(chartOptionModel, optionModel) {
    super(chartOptionModel);
    this._optionModel = optionModel;
  }

  /**
   * Creates a new chart option.
   * @param {object} chartOptionData - The data for the new chart option.
   * @param {number} chartOptionData.chart_id - The ID of the chart.
   * @param {number} chartOptionData.option_id - The ID of the option.
   * @returns {Promise<ChartOption>} - A promise that resolves to the created chart option.
   * @throws {Error} - Throws an error if there is an issue during the creation.
   */
  async createChartOption(chartOptionData) {
    try {
      const newChartOption = await this._model.create(chartOptionData);
      return newChartOption;
    } catch (error) {
      this._logger.errorMessage(`Error creating chart option: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finds the options for a specific chart by its ID.
   * @param {number} chartId - The ID of the chart.
   * @returns {Promise<Array<Option>>} - A promise that resolves to an array of options.
   * @throws {Error} - Throws an error if no options are found or if there is an issue during the search.
   */
  async findChartOptionsByChartId(chartId) {
    try {
      const chartOptions = await this._model.findAll({
        where: { chart_id: chartId },
        include: {
          model: this._optionModel,
        },
      });
      if (!chartOptions.length) {
        throw new Error('No options found for the given chart ID');
      }
      return chartOptions.map((chartOption) => chartOption.Option);
    } catch (error) {
      this._logger.errorMessage(`Error finding chart option by ID: ${error}`);
      throw error;
    }
  }

  /**
   * Deletes a chart option from the database.
   * @param {string} chartId - The ID of the chart.
   * @param {number} optionId - The ID of the option to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   * @throws {Error} If the deletion fails.
   */

  async deleteChartOption(chartId, optionId) {
    try {
      await this._model.destroy({
        where: { chart_id: chartId, option_id: optionId },
      });
    } catch (error) {
      this._logger.errorMessage(`Failed to delete chart option: ${error.message}`);
    }
  }
}
