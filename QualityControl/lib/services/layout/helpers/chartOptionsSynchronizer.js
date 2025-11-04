/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { NotFoundError } from '@aliceo2/web-ui';

/**
 * @typedef {import('../../../database/repositories/ChartOptionsRepository.js')
 * .ChartOptionsRepository} ChartOptionsRepository
 */

export class ChartOptionsSynchronizer {
  /**
   * Creates an instance of ChartOptionsSynchronizer.
   * @param {ChartOptionsRepository} chartOptionRepository Chart options repository
   * @param optionsRepository
   */
  constructor(chartOptionRepository, optionsRepository) {
    this._chartOptionRepository = chartOptionRepository;
    this._optionsRepository = optionsRepository;
  }

  /**
   * Synchronize chart options with the database.
   * @param {object} chart Chart object
   * @param {Array<object>} chart.options Array of options
   * @param {object} transaction Sequelize transaction
   */
  async sync(chart, transaction) {
    if (!(chart.options && chart.options.length)) {
      return;
    }

    let existingOptions = null;
    let existingOptionIds = null;
    let incomingOptions = null;
    let incomingOptionIds = null;

    existingOptions = await this._chartOptionRepository.findChartOptionsByChartId(chart.id, { transaction });
    existingOptionIds = existingOptions.map((co) => co.option_id);
    incomingOptions = await Promise.all(chart.options.map((o) =>
      this._optionsRepository.findOptionByName(o, { transaction })));
    incomingOptionIds = incomingOptions.map((o) => o.id);

    const toDelete = existingOptionIds.filter((id) => !incomingOptionIds.includes(id));
    for (const optionId of toDelete) {
      const deletedCount = await this._chartOptionRepository.delete({ chartId: chart.id, optionId }, { transaction });
      if (deletedCount === 0) {
        throw new NotFoundError(`Not found chart option with chart=${chart.id} and option=${optionId} for deletion`);
      }
    }

    for (const option of incomingOptions) {
      if (!existingOptionIds.includes(option.id)) {
        const createdOption = await this._chartOptionRepository.create(
          { chart_id: chart.id, option_id: option.id },
          { transaction },
        );
        if (!createdOption) {
          throw new Error('Option creation returned null');
        }
      }
    }
  }
}
