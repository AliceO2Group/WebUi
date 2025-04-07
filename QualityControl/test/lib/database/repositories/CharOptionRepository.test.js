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

import { ok, doesNotThrow, rejects } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { ChartOptionsRepository } from '../../../../lib/database/repositories/ChartOptionsRepository.js';
import { LogManager } from '@aliceo2/web-ui';

export const chartOptionRepositoryTestSuite = async () => {
  suite('ChartOptionsRepository', () => {
    let chartOptionModelMock = null;
    let repository = null;
    let loggerMock = null;

    beforeEach(() => {
    // Mock the logger
      loggerMock = {
        errorMessage: sinon.stub(),
      };
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);

      // Mock the model methods
      chartOptionModelMock = {
        create: sinon.stub(),
        findAll: sinon.stub(),
        destroy: sinon.stub(),
        update: sinon.stub(),
      };

      // Initialize the repository
      repository = new ChartOptionsRepository(chartOptionModelMock);
    });

    afterEach(() => {
      sinon.restore();
    });

    suite('createChartOption', () => {
      test('should create a new chart option', async () => {
        const chartOptionData = { chart_id: 1, option_id: 2 };
        const createdChartOption = { id: 1, ...chartOptionData };
        chartOptionModelMock.create.resolves(createdChartOption);

        const result = await repository.createChartOption(chartOptionData);
        ok(result === createdChartOption);
        ok(chartOptionModelMock.create.calledWith(chartOptionData));
      });

      test('should throw an error if creation fails', async () => {
        const chartOptionData = { chart_id: 1, option_id: 2 };
        const error = new Error('Creation failed');
        chartOptionModelMock.create.rejects(error);

        await rejects(
          async () => await repository.createChartOption(chartOptionData),
          error,
        );
      });
    });

    suite('findChartOptionsByChartId', () => {
      test('should find chart options for a given chartId', async () => {
        const chartId = 1;
        const chartOptions = [{ id: 1, chart_id: chartId, option_id: 2 }];
        chartOptionModelMock.findAll.resolves(chartOptions);

        const result = await repository.findChartOptionsByChartId(chartId);
        ok(result.length === 1);
        ok(result[0].chart_id === chartId);
        ok(chartOptionModelMock.findAll.calledWith({ where: { chart_id: chartId } }));
      });

      test('should return an empty array if no options found', async () => {
        const chartId = 1;
        chartOptionModelMock.findAll.resolves([]);

        const result = await repository.findChartOptionsByChartId(chartId);
        ok(result.length === 0);
      });

      test('should throw an error if the search fails', async () => {
        const chartId = 1;
        const error = new Error('Search failed');
        chartOptionModelMock.findAll.rejects(error);

        await rejects(
          async () => await repository.findChartOptionsByChartId(chartId),
          error,
        );
      });
    });

    suite('deleteChartOption', () => {
      test('should delete a chart option', async () => {
        const chartId = 1;
        const optionId = 2;
        chartOptionModelMock.destroy.resolves(1); // Indicates successful deletion

        doesNotThrow(async () => {
          await repository.deleteChartOption(chartId, optionId);
        });

        ok(chartOptionModelMock.destroy.calledWith({ where: { chart_id: chartId, option_id: optionId } }));
      });

      test('should log an error if deletion fails', async () => {
        const chartId = 1;
        const optionId = 2;
        const error = new Error('Deletion failed');
        chartOptionModelMock.destroy.rejects(error);

        doesNotThrow(async () => {
          await repository.deleteChartOption(chartId, optionId);
        });
      });
    });

    suite('updateChartOption', () => {
      test('should update an existing chart option', async () => {
        const chartOption = { chartId: 1, optionId: 2 };
        chartOptionModelMock.update.resolves([1]);

        doesNotThrow(async () => {
          await repository.updateChartOption(chartOption);
        });

        ok(chartOptionModelMock.update.called);
      });

      test('should throw an error if no rows are affected (no changes made)', async () => {
        const chartOption = { chartId: 1, optionId: 2 };
        chartOptionModelMock.update.resolves([0]);

        await rejects(
          async () => await repository.updateChartOption(chartOption),
          new Error('Chart option not found or no changes made'),
        );
      });
    });
  });
};
