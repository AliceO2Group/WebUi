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
 * @typedef {object} ChartOptionAttributes
 * @property {number} chart_id chart ID
 * @property {number} option_id - option ID
 */

/**
 * Repository for managing chart options.
 */
export class ChartOptionsRepository extends BaseRepository {
  constructor(chartOptionModel) {
    super(chartOptionModel);
  }

  /**
   * Finds all chart options by chart ID.
   * @param {number} chartId - Chart identifier.
   * @param {object} options - Additional options for the query (e.g. transaction).
   * @returns {Promise<ChartOptionAttributes[]>} List of chart options.
   */
  async findChartOptionsByChartId(chartId, options = {}) {
    return super.findAll({ where: { chart_id: chartId }, ...options });
  }

  /**
   * Finds a chart option by chart ID and option ID.
   * @param {number} chartId - Chart identifier.
   * @param {number} optionId - Option identifier.
   * @param {object} options - Additional options for the query (e.g. transaction).
   * @returns {Promise<ChartOptionAttributes|null>} The found chart option or null if not found.
   */
  async findChartOption(chartId, optionId, options = {}) {
    return super.findOne({ chart_id: chartId, option_id: optionId }, { ...options });
  }
}
