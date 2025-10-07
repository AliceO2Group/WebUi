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

import { deepStrictEqual, strictEqual, rejects } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';

import { ChartOptionsSynchronizer } from '../../../../../lib/services/layout/helpers/chartOptionsSynchronizer.js';

export const chartOptionsSynchronizerTestSuite = async () => {
  suite('ChartOptionsSynchronizer Test Suite', () => {
    let mockChartOptionRepository = null;
    let mockOptionsRepository = null;
    let mockTransaction = null;
    let synchronizer = null;

    beforeEach(() => {
      // Mock repositories
      mockChartOptionRepository = {
        findChartOptionsByChartId: () => Promise.resolve([]),
        delete: () => Promise.resolve(),
        create: () => Promise.resolve(),
      };

      mockOptionsRepository = {
        findOptionByName: () => Promise.resolve({ id: 1, name: 'test-option' }),
      };

      mockTransaction = { id: 'mock-transaction', rollback: () => {} };
      synchronizer = new ChartOptionsSynchronizer(mockChartOptionRepository, mockOptionsRepository);
    });

    suite('Constructor', () => {
      test('should successfully initialize ChartOptionsSynchronizer', () => {
        const chartRepo = { test: 'chartRepo' };
        const optionsRepo = { test: 'optionsRepo' };
        const sync = new ChartOptionsSynchronizer(chartRepo, optionsRepo);

        strictEqual(sync._chartOptionRepository, chartRepo);
        strictEqual(sync._optionsRepository, optionsRepo);
        strictEqual(typeof sync._logger, 'object');
      });
    });

    suite('sync() method', () => {
      test('should return early when chart has no options', async () => {
        const chart = { id: 1 };
        let findCalled = false;

        mockChartOptionRepository.findChartOptionsByChartId = () => {
          findCalled = true;
          return Promise.resolve([]);
        };

        await synchronizer.sync(chart, mockTransaction);
        strictEqual(findCalled, false, 'Should not call repository when no options');
      });

      test('should return early when chart has empty options array', async () => {
        const chart = { id: 1, options: [] };
        let findCalled = false;

        mockChartOptionRepository.findChartOptionsByChartId = () => {
          findCalled = true;
          return Promise.resolve([]);
        };

        await synchronizer.sync(chart, mockTransaction);
        strictEqual(findCalled, false, 'Should not call repository when options array is empty');
      });

      test('should create new chart options when none exist', async () => {
        const chart = { id: 1, options: ['option1', 'option2'] };
        const createdOptions = [];

        mockChartOptionRepository.findChartOptionsByChartId = () => Promise.resolve([]);
        mockOptionsRepository.findOptionByName = (name) => Promise.resolve({ id: name === 'option1' ? 10 : 20, name });
        mockChartOptionRepository.create = (data) => {
          createdOptions.push(data);
          return Promise.resolve(data);
        };

        await synchronizer.sync(chart, mockTransaction);

        strictEqual(createdOptions.length, 2);
        deepStrictEqual(createdOptions[0], { chart_id: 1, option_id: 10 });
        deepStrictEqual(createdOptions[1], { chart_id: 1, option_id: 20 });
      });

      test('should delete chart options that are no longer present', async () => {
        const chart = { id: 1, options: ['option2'] };
        const deletedOptions = [];

        mockChartOptionRepository.findChartOptionsByChartId = () => Promise.resolve([
          { option_id: 10 }, // This should be deleted
          { option_id: 20 }, // This should remain
        ]);
        mockOptionsRepository.findOptionByName = () => Promise.resolve({ id: 20, name: 'option2' });
        mockChartOptionRepository.delete = (data) => {
          deletedOptions.push(data);
          return Promise.resolve(1);
        };

        await synchronizer.sync(chart, mockTransaction);

        strictEqual(deletedOptions.length, 1);
        deepStrictEqual(deletedOptions[0], { chartId: 1, optionId: 10 });
      });

      test('should handle mixed create and delete operations', async () => {
        const chart = { id: 1, options: ['option2', 'option3'] };
        const createdOptions = [];
        const deletedOptions = [];

        mockChartOptionRepository.findChartOptionsByChartId = () => Promise.resolve([
          { option_id: 10 }, // Should be deleted (option1 no longer present)
          { option_id: 20 }, // Should remain (option2 still present)
        ]);

        mockOptionsRepository.findOptionByName = (name) => {
          if (name === 'option2') {
            return Promise.resolve({ id: 20, name });
          }
          if (name === 'option3') {
            return Promise.resolve({ id: 30, name });
          }
          return Promise.resolve({ id: 999, name });
        };

        mockChartOptionRepository.delete = (data) => {
          deletedOptions.push(data);
          return Promise.resolve(1);
        };

        mockChartOptionRepository.create = (data) => {
          createdOptions.push(data);
          return Promise.resolve(data);
        };

        await synchronizer.sync(chart, mockTransaction);

        // Should delete option with id 10
        strictEqual(deletedOptions.length, 1);
        deepStrictEqual(deletedOptions[0], { chartId: 1, optionId: 10 });

        // Should create option with id 30 (option3 is new)
        strictEqual(createdOptions.length, 1);
        deepStrictEqual(createdOptions[0], { chart_id: 1, option_id: 30 });
      });

      test('should not create or delete when options are already synchronized', async () => {
        const chart = { id: 1, options: ['option1', 'option2'] };
        let createCalled = false;
        let deleteCalled = false;

        mockChartOptionRepository.findChartOptionsByChartId = () => Promise.resolve([
          { option_id: 10 },
          { option_id: 20 },
        ]);

        mockOptionsRepository.findOptionByName = (name) => {
          if (name === 'option1') {
            return Promise.resolve({ id: 10, name });
          }
          if (name === 'option2') {
            return Promise.resolve({ id: 20, name });
          }
          return Promise.resolve({ id: 999, name });
        };

        mockChartOptionRepository.delete = () => {
          deleteCalled = true;
        };

        mockChartOptionRepository.create = () => {
          createCalled = true;
        };

        await synchronizer.sync(chart, mockTransaction);

        strictEqual(createCalled, false, 'Should not create any options');
        strictEqual(deleteCalled, false, 'Should not delete any options');
      });

      test('should throw error when findOptionByName fails', async () => {
        let rollbackCalled = false;
        const chart = { id: 1, options: ['option1'] };
        const error = new Error('Database connection failed');

        mockChartOptionRepository.findChartOptionsByChartId = () => Promise.resolve([]);
        mockOptionsRepository.findOptionByName = () => Promise.reject(error);
        mockTransaction.rollback = () => {
          rollbackCalled = true;
        };
        await rejects(
          async () => await synchronizer.sync(chart, mockTransaction),
          error,
        );
        strictEqual(rollbackCalled, true, 'Transaction should be rolled back on error');
      });

      test('should throw error when create fails', async () => {
        const chart = { id: 1, options: ['option1'] };
        const error = new Error('Failed to create chart option');
        let rollbackCalled = false;

        mockChartOptionRepository.findChartOptionsByChartId = () => Promise.resolve([]);
        mockOptionsRepository.findOptionByName = () => Promise.resolve({ id: 10, name: 'option1' });
        mockChartOptionRepository.create = () => Promise.reject(error);

        mockTransaction.rollback = () => {
          rollbackCalled = true;
        };

        await rejects(
          async () => await synchronizer.sync(chart, mockTransaction),
          error,
        );
        strictEqual(rollbackCalled, true, 'Transaction should be rolled back on error');
      });
    });
  });
};
