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
        findAll: stub(),
        findByPk: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
        findOne: stub(),
        bulkCreate: stub(),
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

    test('should find a chart option by chart ID and option ID', async () => {
      const chartId = 1;
      const optionId = 2;
      const foundOption = { chart_id: chartId, option_id: optionId };
      mockChartOptionsModel.findOne.resolves(foundOption);

      const result = await chartOptionsRepository.findChartOption(chartId, optionId, { transaction: 'tx' });
      deepStrictEqual(result, foundOption);
      ok(mockChartOptionsModel.findOne.calledOnceWith({
        where: { chart_id: chartId, option_id: optionId },
        transaction: 'tx',
      }));
    });

    test('should return null if chart option not found', async () => {
      const chartId = 1;
      const optionId = 99;
      mockChartOptionsModel.findOne.resolves(null);

      const result = await chartOptionsRepository.findChartOption(chartId, optionId, { transaction: 'tx' });
      strictEqual(result, null);
      ok(mockChartOptionsModel.findOne.calledOnceWith({
        where: { chart_id: chartId, option_id: optionId },
        transaction: 'tx',
      }), `findOne called with incorrect parameters: ${JSON.stringify(mockChartOptionsModel.findOne.getCall(0).args)}`);
    });

    test('should delete a chart option by ID', async () => {
      const chartOptionId = 1;
      mockChartOptionsModel.destroy.resolves(1);

      const result = await chartOptionsRepository.deleteChartOption(chartOptionId, { transaction: 'tx' });
      strictEqual(result, 1);
      ok(mockChartOptionsModel.destroy.calledOnceWith({
        where: { id: chartOptionId },
        transaction: 'tx',
      }));
    });
  });
};
