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

import { deepStrictEqual, strictEqual, rejects, throws } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';

import { GridTabCellSynchronizer } from '../../../../../lib/services/layout/helpers/gridTabCellSynchronizer.js';
import { mapObjectToChartAndCell } from '../../../../../lib/services/layout/helpers/mapObjectToChartAndCell.js';

export const gridTabCellSynchronizerTestSuite = async () => {
  suite('GridTabCellSynchronizer Test Suite', () => {
    let mockGridTabCellRepository = null;
    let mockChartRepository = null;
    let mockChartOptionsSynchronizer = null;
    let mockTransaction = null;
    let synchronizer = null;

    beforeEach(() => {
      // Mock repositories
      mockGridTabCellRepository = {
        findByTabId: () => Promise.resolve([]),
        updateGridTabCell: () => Promise.resolve(1),
        createGridTabCell: () => Promise.resolve({ id: 1 }),
      };

      mockChartRepository = {
        deleteChart: () => Promise.resolve(1),
        updateChart: () => Promise.resolve(1),
        createChart: () => Promise.resolve({ id: 1 }),
      };

      mockChartOptionsSynchronizer = {
        sync: () => Promise.resolve(),
      };

      mockTransaction = { id: 'mock-transaction', rollback: () => {} };
      synchronizer = new GridTabCellSynchronizer(
        mockGridTabCellRepository,
        mockChartRepository,
        mockChartOptionsSynchronizer,
      );
    });

    suite('Constructor', () => {
      test('should successfully initialize GridTabCellSynchronizer', () => {
        const gridTabCellRepo = { test: 'gridTabCellRepo' };
        const chartRepo = { test: 'chartRepo' };
        const chartOptionsSync = { test: 'chartOptionsSync' };
        const sync = new GridTabCellSynchronizer(gridTabCellRepo, chartRepo, chartOptionsSync);

        strictEqual(sync._gridTabCellRepository, gridTabCellRepo);
        strictEqual(sync._chartRepository, chartRepo);
        strictEqual(sync._chartOptionsSynchronizer, chartOptionsSync);
        strictEqual(typeof sync._logger, 'object');
      });
    });

    suite('sync() method', () => {
      test('should create new charts and cells when none exist', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 1, name: 'New Chart' }];
        const createdCharts = [];
        const createdCells = [];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([]);
        mockChartRepository.createChart = (chart) => {
          createdCharts.push(chart);
          return Promise.resolve({ id: chart.id });
        };
        mockGridTabCellRepository.createGridTabCell = (cell) => {
          createdCells.push(cell);
          return Promise.resolve({ id: 1 });
        };

        await synchronizer.sync(tabId, objects, mockTransaction);

        strictEqual(createdCharts.length, 1);
        strictEqual(createdCells.length, 1);
      });

      test('should update existing charts and cells', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 1, name: 'Updated Chart' }];
        const updatedCharts = [];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([{ chart_id: 1 }]);
        mockChartRepository.updateChart = (chartId, chart) => {
          updatedCharts.push({ chartId, chart });
          return Promise.resolve(1);
        };

        await synchronizer.sync(tabId, objects, mockTransaction);

        strictEqual(updatedCharts.length, 1);
        strictEqual(updatedCharts[0].chartId, 1);
      });

      test('should delete charts that are no longer present', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 2 }];
        const deletedCharts = [];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([
          { chart_id: 1 }, // Should be deleted
          { chart_id: 2 }, // Should remain
        ]);
        mockChartRepository.deleteChart = (chartId) => {
          deletedCharts.push(chartId);
          return Promise.resolve(1);
        };
        mockChartRepository.updateChart = () => Promise.resolve(1);
        mockGridTabCellRepository.updateGridTabCell = () => Promise.resolve(1);

        await synchronizer.sync(tabId, objects, mockTransaction);

        strictEqual(deletedCharts.length, 1);
        strictEqual(deletedCharts[0], 1);
      });

      test('should call chartOptionsSynchronizer for each object', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 1, options: ['option1'] }];
        const syncCalls = [];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([]);
        mockChartRepository.createChart = (chart) => Promise.resolve({ id: chart.id });
        mockGridTabCellRepository.createGridTabCell = () => Promise.resolve({ id: 1 });
        mockChartOptionsSynchronizer.sync = (chart) => {
          syncCalls.push({ chartId: chart.id, options: chart.options });
          return Promise.resolve();
        };

        await synchronizer.sync(tabId, objects, mockTransaction);

        strictEqual(syncCalls.length, 1);
        strictEqual(syncCalls[0].chartId, 1);
        deepStrictEqual(syncCalls[0].options, ['option1']);
      });

      test('should throw error and rollback when operation fails', async () => {
        const tabId = 'test-tab';
        const objects = [];
        const error = new Error('Database connection failed');
        let rollbackCalled = false;

        mockGridTabCellRepository.findByTabId = () => Promise.reject(error);
        mockTransaction.rollback = () => {
          rollbackCalled = true;
        };

        await rejects(
          async () => await synchronizer.sync(tabId, objects, mockTransaction),
          error,
        );
        strictEqual(rollbackCalled, true, 'Transaction should be rolled back on error');
      });
    });

    suite('map to chart and cell function', () => {
      const mockObject = {
        id: 'chart1',
        x: 0,
        y: 0,
        h: 2,
        w: 3,
        name: 'Test Chart',
        ignoreDefaults: true,
      };
      const mockTabId = 'tab1';
      test('should map object to chart and cell correctly', () => {
        const { chart, cell } = mapObjectToChartAndCell(mockObject, mockTabId);
        strictEqual(chart.id, 'chart1');
        strictEqual(chart.object_name, 'Test Chart');
        strictEqual(chart.ignore_defaults, true);
        strictEqual(cell.tab_id, 'tab1');
        strictEqual(cell.chart_id, 'chart1');
        strictEqual(cell.row, 0);
        strictEqual(cell.col, 0);
        strictEqual(cell.row_span, 2);
        strictEqual(cell.col_span, 3);
      });
      test('should throw error for invalid input', () => {
        throws(() => mapObjectToChartAndCell(null, mockTabId), /Invalid input/);
        throws(() => mapObjectToChartAndCell(mockObject, null), /Invalid input/);
        throws(() => mapObjectToChartAndCell('invalid', mockTabId), /Invalid input/);
      });
    });
  });
};
