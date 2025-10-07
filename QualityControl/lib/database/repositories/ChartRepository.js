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
 * @typedef {object} ChartAttributes
 * @property {string} id id of the chart
 * @property {string} object_name name of the object
 * @property {boolean} ignore_defaults whether to ignore defaults
 */

/**
 * Repository for managing chart options.
 */
export class ChartRepository extends BaseRepository {
  constructor(chartModel) {
    super(chartModel);
  }

  /**
   * Finds a chart by its ID.
   * @param {string} chartId id of the chart
   * @param {object} options additional options for the query (e.g. transaction)
   * @returns {Promise<ChartAttributes|null>} The chart or null if not found.
   */
  async findChartById(chartId, options = {}) {
    return this.model.findByPk(chartId, { ...options });
  }

  /**
   * Creates a new chart.
   * @param {Partial<ChartAttributes>} chartData new chart data
   * @param {object} options additional options for the creation (e.g. transaction)
   * @returns {Promise<ChartAttributes>} The created chart.
   */
  async createChart(chartData, options = {}) {
    return this.model.create(chartData, { ...options });
  }

  /**
   * Updates an existing chart.
   * @param {string} chartId id of the chart to update
   * @param {Partial<ChartAttributes>} updateData new chart data
   * @param {object} options additional options for the update (e.g. transaction)
   * @returns {Promise<number>} Number of updated rows (0 or 1).
   */
  async updateChart(chartId, updateData, options = {}) {
    const [updatedCount] = await this.model.update(updateData, { where: { id: chartId }, ...options });
    return updatedCount;
  }

  /**
   * Deletes a chart.
   * @param {string} chartId id of the chart
   * @param {object} options additional options for the deletion (e.g. transaction)
   * @returns {Promise<number>} Number of deleted rows (0 or 1).
   */
  async deleteChart(chartId, options = {}) {
    return this.model.destroy({ where: { id: chartId }, ...options });
  }
}
