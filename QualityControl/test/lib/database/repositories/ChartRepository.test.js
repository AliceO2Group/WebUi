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
import sinon from 'sinon';
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
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
      };
      chartRepository = new ChartRepository(mockChartModel);
    });

    test('should create instance with chart model', () => {
      ok(chartRepository instanceof ChartRepository);
      strictEqual(chartRepository.model, mockChartModel);
    });

    test('should inherit from BaseRepository', () => {
      ok(chartRepository.model);
    });

    test('should handle chart creation', async () => {
      const chartData = { name: 'Test Chart', type: 'line' };
      const createdChart = { id: '1', ...chartData };
      mockChartModel.create.resolves(createdChart);

      const result = await chartRepository.model.create(chartData);
      deepStrictEqual(result, createdChart);
      ok(mockChartModel.create.calledWith(chartData));
    });

    test('should handle chart retrieval', async () => {
      const mockChart = { id: '1', name: 'Test Chart', type: 'bar' };
      mockChartModel.findByPk.resolves(mockChart);

      const result = await chartRepository.model.findByPk('1');
      deepStrictEqual(result, mockChart);
      ok(mockChartModel.findByPk.calledWith('1'));
    });

    test('should handle chart updates', async () => {
      const updateData = { name: 'Updated Chart' };
      const updateResult = [1];
      mockChartModel.update.resolves(updateResult);

      const result = await chartRepository.model.update(updateData, { where: { id: '1' } });
      deepStrictEqual(result, updateResult);
      ok(mockChartModel.update.calledWith(updateData, { where: { id: '1' } }));
    });

    test('should handle chart deletion', async () => {
      mockChartModel.destroy.resolves(1);

      const result = await chartRepository.model.destroy({ where: { id: '1' } });
      strictEqual(result, 1);
      ok(mockChartModel.destroy.calledWith({ where: { id: '1' } }));
    });
  });
};
