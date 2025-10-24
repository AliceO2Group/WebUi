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
import { mapObjectToChartAndCell } from './mapObjectToChartAndCell.js';

/**
 * Class to synchronize grid tab cells with the database.
 */
export class GridTabCellSynchronizer {
  constructor(gridTabCellRepository, chartRepository, chartOptionsSynchronizer) {
    this._gridTabCellRepository = gridTabCellRepository;
    this._chartRepository = chartRepository;
    this._chartOptionsSynchronizer = chartOptionsSynchronizer;
  }

  /**
   * Synchronize grid tab cells with the database.
   * @param {string} tabId Tab ID
   * @param {Array<object>} objects Array of objects to map to charts and cells
   * @param {object} transaction Sequelize transaction
   */
  async sync(tabId, objects, transaction) {
    const existingCells = await this._gridTabCellRepository.findByTabId(tabId, { transaction });
    const existingChartIds = existingCells.map((cell) => cell.chart_id);

    const incomingChartIds = objects.filter((obj) => obj.id).map((obj) => obj.id);
    const toDelete = incomingChartIds.length
      ? existingChartIds.filter((id) => !incomingChartIds.includes(id))
      : existingChartIds;

    for (const chartId of toDelete) {
      const deletedCount = await this._chartRepository.delete(chartId, { transaction });
      if (deletedCount === 0) {
        throw new NotFoundError(`Not found chart with id=${chartId} for deletion`);
      }
    }
    for (const object of objects) {
      const { chart, cell } = mapObjectToChartAndCell(object, tabId);
      let chartId = chart?.id;
      if (existingChartIds.includes(chart.id)) {
        const updatedRows = await this._chartRepository.update(chart.id, chart, { transaction });
        const updatedCells =
            await this._gridTabCellRepository.update({ chartId: chart.id, tabId }, cell, { transaction });
        if (updatedRows === 0 || updatedCells === 0) {
          throw new NotFoundError(`Chart or cell not found for update (chartId=${chart.id}, tabId=${tabId})`);
        }
      } else {
        const createdChart = await this._chartRepository.create(chart, { transaction });
        chartId = createdChart.id;
        const createdCell = await this._gridTabCellRepository.create({ ...cell, chart_id: chartId }, { transaction });
        if (!createdChart || !createdCell) {
          throw new NotFoundError('Chart or cell not found for creation');
        }
      }
      await this._chartOptionsSynchronizer.sync({ ...chart, options: object?.options, id: chartId }, transaction);
    }
  }
}
