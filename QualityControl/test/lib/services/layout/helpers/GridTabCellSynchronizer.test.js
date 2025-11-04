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
        update: () => Promise.resolve(1),
        create: () => Promise.resolve({ id: 1 }),
      };

      mockChartRepository = {
        delete: () => Promise.resolve(1),
        update: () => Promise.resolve(1),
        create: () => Promise.resolve({ id: 1 }),
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
        strictEqual(synchronizer._gridTabCellRepository, mockGridTabCellRepository);
        strictEqual(synchronizer._chartRepository, mockChartRepository);
        strictEqual(synchronizer._chartOptionsSynchronizer, mockChartOptionsSynchronizer);
      });
    });

    suite('sync() method', () => {
      test('should create new charts and cells when none exist', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 1, name: 'New Chart' }];
        const createdCharts = [];
        const createdCells = [];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([]);
        mockChartRepository.create = (chart) => {
          createdCharts.push(chart);
          return Promise.resolve({ id: chart.id });
        };
        mockGridTabCellRepository.create = (cell) => {
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
        mockChartRepository.update = (chartId, chart) => {
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
        mockChartRepository.delete = (chartId) => {
          deletedCharts.push(chartId);
          return Promise.resolve(1);
        };
        mockChartRepository.update = () => Promise.resolve(1);
        mockGridTabCellRepository.update = () => Promise.resolve(1);

        await synchronizer.sync(tabId, objects, mockTransaction);

        strictEqual(deletedCharts.length, 1);
        strictEqual(deletedCharts[0], 1);
      });

      test('should call chartOptionsSynchronizer for each object', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 1, options: ['option1'] }];
        const syncCalls = [];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([]);
        mockChartRepository.create = (chart) => Promise.resolve({ id: chart.id });
        mockGridTabCellRepository.create = () => Promise.resolve({ id: 1 });
        mockChartOptionsSynchronizer.sync = (chart) => {
          syncCalls.push({ chartId: chart.id, options: chart.options });
          return Promise.resolve();
        };

        await synchronizer.sync(tabId, objects, mockTransaction);

        strictEqual(syncCalls.length, 1);
        strictEqual(syncCalls[0].chartId, 1);
        deepStrictEqual(syncCalls[0].options, ['option1']);
      });

      test('should throw error when updating non-existing chart', async () => {
        const tabId = 'test-tab';
        const objects = [{ id: 1, name: 'Non-existing Chart' }];

        mockGridTabCellRepository.findByTabId = () => Promise.resolve([{ chart_id: 1 }]);
        mockChartRepository.update = () => Promise.resolve(0);
        mockGridTabCellRepository.update = () => Promise.resolve(0);

        await rejects(
          synchronizer.sync(tabId, objects, mockTransaction),
          /Chart or cell not found for update/,
        );
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
