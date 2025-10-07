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
import { ChartOptionsRepository } from '../../../../lib/database/repositories/ChartOptionsRepository.js';

/**
 * Test suite for ChartOptionsRepository
 */
export const chartOptionsRepositoryTestSuite = () => {
  suite('ChartOptionsRepository', () => {
    let mockChartOptionsModel = null;
    let chartOptionsRepository = null;

    beforeEach(() => {
      mockChartOptionsModel = {
        name: 'ChartOptions',
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
        bulkCreate: sinon.stub(),
      };
      chartOptionsRepository = new ChartOptionsRepository(mockChartOptionsModel);
    });

    test('should create instance with chart options model', () => {
      ok(chartOptionsRepository instanceof ChartOptionsRepository);
      strictEqual(chartOptionsRepository.model, mockChartOptionsModel);
    });

    test('should create a new chart option', async () => {
      const optionData = { chart_id: 1, option_id: 2 };
      const createdOption = { id: 1, ...optionData };
      mockChartOptionsModel.create.resolves(createdOption);

      const result = await chartOptionsRepository.createChartOption(optionData, { transaction: 'tx' });
      deepStrictEqual(result, createdOption);
      ok(mockChartOptionsModel.create.calledOnceWith(optionData, { transaction: 'tx' }));
    });

    test('should find chart options by chart ID', async () => {
      const chartId = 1;
      const foundOptions = [{ chart_id: chartId, option_id: 2 }, { chart_id: chartId, option_id: 3 }];
      mockChartOptionsModel.findAll.resolves(foundOptions);

      const result = await chartOptionsRepository.findChartOptionsByChartId(chartId, { transaction: 'tx' });
      deepStrictEqual(result, foundOptions);
      ok(mockChartOptionsModel.findAll.calledOnceWith({ where: { chart_id: chartId }, transaction: 'tx' }));
    });

    test('should delete a chart option', async () => {
      const params = { chartId: 1, optionId: 2 };
      mockChartOptionsModel.destroy.resolves(1);

      const result = await chartOptionsRepository.deleteChartOption(params, { transaction: 'tx' });
      strictEqual(result, 1);
      ok(mockChartOptionsModel.destroy.calledOnceWith({
        where: { chart_id: params.chartId, option_id: params.optionId }, transaction: 'tx' }));
    });
  });
};
