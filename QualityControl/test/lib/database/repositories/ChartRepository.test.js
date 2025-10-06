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

import { suite, test, beforeEach } from 'node:test';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { stub } from 'sinon';
import { ChartRepository } from '../../../../lib/database/repositories/ChartRepository.js';

/**
 * Test suite for ChartRepository
 */
export const chartRepositoryTestSuite = () => {
  suite('ChartRepository', () => {
    let mockChartModel = null;
    let chartRepository = null;

    beforeEach(() => {
      mockChartModel = {
        name: 'Chart',
        findAll: stub(),
        findByPk: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
        findOne: stub(),
      };
      chartRepository = new ChartRepository(mockChartModel);
    });

    test('should create instance with chart model', () => {
      ok(chartRepository instanceof ChartRepository);
      strictEqual(chartRepository.model, mockChartModel);
    });

    test('should find a chart by ID', async () => {
      const chartId = 'chart1';
      const foundChart = { id: chartId, object_name: 'Test Chart', ignore_defaults: false };
      mockChartModel.findByPk.resolves(foundChart);

      const result = await chartRepository.findChartById(chartId, { transaction: 'tx' });
      deepStrictEqual(result, foundChart);
      ok(mockChartModel.findByPk.calledOnceWith(chartId, { transaction: 'tx' }));
    });

    test('should create a new chart', async () => {
      const chartData = { id: 'chart2', object_name: 'New Chart', ignore_defaults: true };
      const createdChart = { ...chartData };
      mockChartModel.create.resolves(createdChart);

      const result = await chartRepository.createChart(chartData, { transaction: 'tx' });
      deepStrictEqual(result, createdChart);
      ok(mockChartModel.create.calledOnceWith(chartData, { transaction: 'tx' }));
    });

    test('should update an existing chart', async () => {
      const chartId = 'chart1';
      const updateData = { object_name: 'Updated Chart', ignore_defaults: true };
      mockChartModel.update.resolves(1); // Simulate one row updated

      const result = await chartRepository.updateChart(chartId, updateData, { transaction: 'tx' });
      strictEqual(result, 1);
      ok(mockChartModel.update.calledOnceWith(updateData, { where: { id: chartId }, transaction: 'tx' }));
    });

    test('should delete a chart by ID', async () => {
      const chartId = 'chart1';
      mockChartModel.destroy.resolves(1); // Simulate one row deleted

      const result = await chartRepository.deleteChart(chartId, { transaction: 'tx' });
      strictEqual(result, 1);
      ok(mockChartModel.destroy.calledOnceWith({ where: { id: chartId }, transaction: 'tx' }));
    });
  });
};
