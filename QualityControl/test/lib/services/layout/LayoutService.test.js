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

import { strictEqual, rejects } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';

import { LayoutService } from '../../../../lib/services/layout/LayoutService.js';

export const layoutServiceTestSuite = async () => {
  suite('LayoutService Test Suite', () => {
    let mockLayoutRepository = null;
    let mockUserRepository = null;
    let mockTabRepository = null;
    let mockGridTabCellRepository = null;
    let mockChartRepository = null;
    let mockChartOptionsRepository = null;
    let mockOptionRepository = null;
    let mockTransaction = null;
    let layoutService = null;

    beforeEach(() => {
      mockTransaction = {
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
      };

      mockLayoutRepository = {
        model: {
          sequelize: {
            transaction: () => Promise.resolve(mockTransaction),
          },
        },
        findLayoutsByFilters: () => Promise.resolve([]),
        findLayoutById: () => Promise.resolve({ id: '1', name: 'Test Layout' }),
        updateLayout: () => Promise.resolve(1),
        deleteLayout: () => Promise.resolve(1),
        createLayout: () => Promise.resolve({ id: '1', name: 'New Layout' }),
      };

      mockUserRepository = {
        findUser: () => Promise.resolve({ id: 1, username: 'testuser' }),
      };

      mockTabRepository = {
        findTabsByLayoutId: () => Promise.resolve([]),
        deleteTab: () => Promise.resolve(1),
        updateTab: () => Promise.resolve(1),
        createTab: () => Promise.resolve({ id: 1 }),
      };

      mockGridTabCellRepository = {
        findObjectByChartId: () => Promise.resolve({ id: '1', name: 'Test Object' }),
        findByTabId: () => Promise.resolve([]),
        updateGridTabCell: () => Promise.resolve(1),
        createGridTabCell: () => Promise.resolve({ id: 1 }),
      };

      mockChartRepository = {
        deleteChart: () => Promise.resolve(1),
        updateChart: () => Promise.resolve(1),
        createChart: () => Promise.resolve({ id: 1 }),
      };

      mockChartOptionsRepository = {
        findChartOptionsByChartId: () => Promise.resolve([]),
        deleteChartOption: () => Promise.resolve(),
        createChartOption: () => Promise.resolve(),
      };

      mockOptionRepository = {
        findOptionByName: () => Promise.resolve({ id: 1, name: 'test-option' }),
      };

      layoutService = new LayoutService(
        mockLayoutRepository,
        mockUserRepository,
        mockTabRepository,
        mockGridTabCellRepository,
        mockChartRepository,
        mockChartOptionsRepository,
        mockOptionRepository,
      );
    });

    suite('Constructor', () => {
      test('should successfully initialize LayoutService', () => {
        strictEqual(typeof layoutService._layoutRepository, 'object');
        strictEqual(typeof layoutService._userService, 'object');
        strictEqual(typeof layoutService._tabSynchronizer, 'object');
        strictEqual(typeof layoutService._logger, 'object');
      });
    });

    suite('getLayoutsByFilters()', () => {
      test('should return layouts from repository', async () => {
        const mockLayouts = [{ id: '1', name: 'Layout 1' }];
        mockLayoutRepository.findLayoutsByFilters = () => Promise.resolve(mockLayouts);

        const result = await layoutService.getLayoutsByFilters({});
        strictEqual(result, mockLayouts);
      });

      test('should handle owner_id filter by converting to username', async () => {
        const filters = { owner_id: 1 };
        let capturedFilters = null;

        mockLayoutRepository.findLayoutsByFilters = (filters) => {
          capturedFilters = filters;
          return Promise.resolve([]);
        };

        await layoutService.getLayoutsByFilters(filters);
        strictEqual(capturedFilters.owner_username, 'testuser');
        strictEqual(capturedFilters.owner_id, undefined);
      });
    });

    suite('getLayoutById()', () => {
      test('should return layout when found', async () => {
        const mockLayout = { id: '1', name: 'Test Layout' };
        mockLayoutRepository.findLayoutById = () => Promise.resolve(mockLayout);

        const result = await layoutService.getLayoutById('1');
        strictEqual(result, mockLayout);
      });

      test('should throw NotFoundError when layout not found', async () => {
        mockLayoutRepository.findLayoutById = () => Promise.resolve(null);

        await rejects(
          async () => await layoutService.getLayoutById('999'),
          /Layout with id: 999 was not found/,
        );
      });
    });

    suite('getObjectById()', () => {
      test('should return object when found', async () => {
        const mockObject = { id: '1', name: 'Test Object' };
        mockGridTabCellRepository.findObjectByChartId = () => Promise.resolve(mockObject);

        const result = await layoutService.getObjectById('1');
        strictEqual(result, mockObject);
      });

      test('should throw InvalidInputError when id is not provided', async () => {
        await rejects(
          async () => await layoutService.getObjectById(null),
          /Id must be provided/,
        );
      });

      test('should throw NotFoundError when object not found', async () => {
        mockGridTabCellRepository.findObjectByChartId = () => Promise.resolve(null);

        await rejects(
          async () => await layoutService.getObjectById('999'),
          /Object with id 999 not found/,
        );
      });
    });

    suite('postLayout()', () => {
      test('should create new layout successfully', async () => {
        const layoutData = { name: 'New Layout', owner_name: 'testuser' };
        const mockCreatedLayout = { id: '1', name: 'New Layout' };

        mockLayoutRepository.createLayout = () => Promise.resolve(mockCreatedLayout);

        const result = await layoutService.postLayout(layoutData);
        strictEqual(result, mockCreatedLayout);
      });

      test('should rollback transaction on error', async () => {
        const layoutData = { name: 'New Layout' };
        const error = new Error('Database error');
        let rollbackCalled = false;

        mockLayoutRepository.createLayout = () => Promise.reject(error);
        mockTransaction.rollback = () => {
          rollbackCalled = true;
          return Promise.resolve();
        };

        await rejects(
          async () => await layoutService.postLayout(layoutData),
          error,
        );
        strictEqual(rollbackCalled, true);
      });
    });

    suite('removeLayout()', () => {
      test('should delete layout successfully', async () => {
        mockLayoutRepository.deleteLayout = () => Promise.resolve(1);

        await layoutService.removeLayout('1');
        // Should not throw
      });

      test('should throw NotFoundError when layout not found for deletion', async () => {
        mockLayoutRepository.deleteLayout = () => Promise.resolve(0);

        await rejects(
          async () => await layoutService.removeLayout('999'),
          /Layout with id 999 not found/,
        );
      });
    });
  });
};
