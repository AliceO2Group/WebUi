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

    test('should initialize with the correct model', () => {
      strictEqual(chartOptionsRepository.model, mockChartOptionsModel);
    });

    test('test should find chart options by chart ID', async () => {
      const chartId = 1;
      const expectedResult = [{ chart_id: chartId, option_id: 101 }, { chart_id: chartId, option_id: 102 }];
      mockChartOptionsModel.findAll.resolves(expectedResult);

      const result = await chartOptionsRepository.findChartOptionsByChartId(chartId);

      deepStrictEqual(result, expectedResult);
      //called args
      ok(mockChartOptionsModel.findAll.calledOnceWithExactly({
        include: [],
        where: { chart_id: chartId },
      }));
    });

    test('test should find a chart option by chart ID and option ID', async () => {
      const chartId = 1;
      const optionId = 101;
      const expectedResult = { chart_id: chartId, option_id: optionId };
      mockChartOptionsModel.findOne.resolves(expectedResult);

      const result = await chartOptionsRepository.findChartOption(chartId, optionId);

      deepStrictEqual(result, expectedResult);
      ok(mockChartOptionsModel.findOne.calledOnceWithExactly({
        include: [],
        where: { chart_id: chartId, option_id: optionId },
      }));
    });
  });
};
