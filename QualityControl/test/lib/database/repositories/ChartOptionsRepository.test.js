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

    test('should inherit from BaseRepository', () => {
      ok(chartOptionsRepository.model);
    });

    test('should handle chart options creation', async () => {
      const optionsData = { chart_id: '1', option_id: '1', value: 'test' };
      const createdOptions = { id: '1', ...optionsData };
      mockChartOptionsModel.create.resolves(createdOptions);

      const result = await chartOptionsRepository.model.create(optionsData);
      deepStrictEqual(result, createdOptions);
      ok(mockChartOptionsModel.create.calledWith(optionsData));
    });

    test('should handle bulk chart options creation', async () => {
      const optionsArray = [
        { chart_id: '1', option_id: '1', value: 'test1' },
        { chart_id: '1', option_id: '2', value: 'test2' },
      ];
      const createdOptions = optionsArray.map((opt, i) => ({ id: String(i + 1), ...opt }));
      mockChartOptionsModel.bulkCreate.resolves(createdOptions);

      const result = await chartOptionsRepository.model.bulkCreate(optionsArray);
      deepStrictEqual(result, createdOptions);
      ok(mockChartOptionsModel.bulkCreate.calledWith(optionsArray));
    });

    test('should handle chart options retrieval by chart', async () => {
      const mockOptions = [
        { id: '1', chart_id: '1', option_id: '1', value: 'test1' },
        { id: '2', chart_id: '1', option_id: '2', value: 'test2' },
      ];
      mockChartOptionsModel.findAll.resolves(mockOptions);

      const result = await chartOptionsRepository.model.findAll({ where: { chart_id: '1' } });
      deepStrictEqual(result, mockOptions);
      ok(mockChartOptionsModel.findAll.calledWith({ where: { chart_id: '1' } }));
    });

    test('should handle chart options deletion', async () => {
      mockChartOptionsModel.destroy.resolves(2);

      const result = await chartOptionsRepository.model.destroy({ where: { chart_id: '1' } });
      strictEqual(result, 2);
      ok(mockChartOptionsModel.destroy.calledWith({ where: { chart_id: '1' } }));
    });
  });
};
