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
import { LogManager } from '@aliceo2/web-ui';
import { ChartRepository } from '../../../../lib/database/repositories/ChartRepository.js';

export const chartRepositoryTestSuite = async () => {
  let chartModelMock = null;
  let repository = null;
  let loggerMock = null;

  beforeEach(() => {
    // Mock the logger
    loggerMock = {
      errorMessage: sinon.stub(),
    };
    // Ensure we mock the logger
    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }

    chartModelMock = {
      create: sinon.stub(),
      findByPk: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub(),
    };

    repository = new ChartRepository(chartModelMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('constructor', () => {
    test('should initialize with the correct model', () => {
      ok(repository._model === chartModelMock);
    });
  });

  suite('findChartById', () => {
    test('should find a chart by its ID', async () => {
      const chartId = 1;
      const chart = { id: chartId, name: 'Test Chart' };
      chartModelMock.findByPk.resolves(chart);

      const result = await repository.findChartById(chartId);
      ok(result === chart);
      ok(chartModelMock.findByPk.calledWith(chartId));
    });

    test('should throw an error if the chart is not found', async () => {
      const chartId = 1;
      chartModelMock.findByPk.resolves(null);

      await rejects(
        async () => await repository.findChartById(chartId),
        new Error('Chart not found'),
      );
    });

    test('should throw an error if search fails', async () => {
      const chartId = 1;
      const error = new Error('Search failed');
      chartModelMock.findByPk.rejects(error);

      await rejects(
        async () => await repository.findChartById(chartId),
        error,
      );
    });
  });

  suite('createChart', () => {
    test('should create a new chart', async () => {
      const chartData = { name: 'New Chart' };
      const createdChart = { id: 1, ...chartData };
      chartModelMock.create.resolves(createdChart);

      const result = await repository.createChart(chartData);
      ok(result === createdChart);
      ok(chartModelMock.create.calledWith(chartData));
    });

    test('should throw an error if creation fails', async () => {
      const chartData = { name: 'New Chart' };
      const error = new Error('Creation failed');
      chartModelMock.create.rejects(error);

      await rejects(
        async () => await repository.createChart(chartData),
        error,
      );
    });
  });

  suite('updateChart', () => {
    test('should update a chart', async () => {
      const chartId = 1;
      const updateData = { name: 'Updated Chart' };
      const affectedRows = 1;
      chartModelMock.update.resolves([affectedRows]);

      const result = await repository.updateChart(chartId, updateData);
      ok(result === affectedRows);
      ok(chartModelMock.update.calledWith(updateData, { where: { id: chartId } }));
    });

    test('should throw an error if the chart is not found or no changes made', async () => {
      const chartId = 1;
      const updateData = { name: 'Updated Chart' };
      chartModelMock.update.resolves([0]);

      await rejects(
        async () => await repository.updateChart(chartId, updateData),
        new Error('Chart not found or no changes made'),
      );
    });

    test('should throw an error if update fails', async () => {
      const chartId = 1;
      const updateData = { name: 'Updated Chart' };
      const error = new Error('Update failed');
      chartModelMock.update.rejects(error);

      await rejects(
        async () => await repository.updateChart(chartId, updateData),
        error,
      );
    });
  });

  suite('deleteChart', () => {
    test('should delete a chart', async () => {
      const chartId = 1;
      chartModelMock.destroy.resolves(1);

      await doesNotThrow(async () => {
        await repository.deleteChart(chartId);
      });
      ok(chartModelMock.destroy.calledWith({ where: { id: chartId } }));
    });

    test('should throw an error if the chart is not found', async () => {
      const chartId = 1;
      chartModelMock.destroy.resolves(0);

      await rejects(
        async () => await repository.deleteChart(chartId),
        new Error('Chart not found'),
      );
    });

    test('should throw an error if deletion fails', async () => {
      const chartId = 1;
      const error = new Error('Deletion failed');
      chartModelMock.destroy.rejects(error);

      await rejects(
        async () => await repository.deleteChart(chartId),
        error,
      );
    });
  });
};
