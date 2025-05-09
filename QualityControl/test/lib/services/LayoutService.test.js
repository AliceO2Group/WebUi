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

import { stub, restore } from 'sinon';
import { deepEqual, ok, rejects, strictEqual } from 'node:assert';
import { suite, test, afterEach, beforeEach } from 'node:test';
import { LogManager, NotFoundError } from '@aliceo2/web-ui';
import { LayoutService } from '../../../lib/services/LayoutService.js';

export const layoutServiceTestSuite = async () => {
  suite('Layout Service Test Suite', () => {
    let loggerMock = null;
    let layoutService = null;
    let userRepositoryMock = null;
    let layoutRepositoryMock = null;
    let tabRepositoryMock = null;
    let gridTabCellRepositoryMock = null;
    let chartRepositoryMock = null;
    let chartOptionsRepositoryMock = null;
    let optionsRepositoryMock = null;
    beforeEach(() => {
      userRepositoryMock = { findUserById: stub() };
      layoutRepositoryMock = {
        findAllLayouts: stub(),
        findByFilters: stub(),
        findLayoutById: stub(),
        findLayoutByName: stub(),
        updateLayout: stub(),
        createLayout: stub(),
        deleteLayout: stub(),
      };
      tabRepositoryMock = { findTabsByLayoutId: stub(), updateTab: stub(), createTab: stub(), deleteTab: stub() };
      gridTabCellRepositoryMock = {
        createGridTabCell: stub(),
        findObjectByChartId: stub(),
        findByTabId: stub(),
        updateGridTabCell: stub(),
        deleteGridTabCell: stub(),
      };
      chartRepositoryMock = { createChart: stub(), updateChart: stub() };
      chartOptionsRepositoryMock = {
        createChartOption: stub(),
        findChartOptionsByChartId: stub(),
        deleteChartOption: stub(),
        updateChartOption: stub(),
      };
      optionsRepositoryMock = { findOptionByName: stub() };

      layoutService = new LayoutService(
        userRepositoryMock,
        layoutRepositoryMock,
        tabRepositoryMock,
        gridTabCellRepositoryMock,
        chartRepositoryMock,
        chartOptionsRepositoryMock,
        optionsRepositoryMock,
      );
      loggerMock = {
        errorMessage: stub(),
      };
      if (!LogManager.getLogger.restore) {
        stub(LogManager, 'getLogger').returns(loggerMock);
      }
    });
    afterEach(() => {
      restore();
    });

    suite('getLayoutsByOwnerId', () => {
      test('should return layouts if user exists and has username', async () => {
        const mockLayouts = [
          { id: 1, name: 'Layout 1', owner_username: 'testuser' },
          { id: 2, name: 'Layout 2', owner_username: 'testuser' },
        ];
        userRepositoryMock.findUserById.resolves({ id: 1, username: 'testuser' });
        stub(layoutService, 'getAllLayouts').resolves(mockLayouts);
        await layoutService.getLayoutsByOwnerId(1);
        ok(layoutService.getAllLayouts.calledWith({ owner_username: 'testuser' }));
      });

      test('should return empty array if user not found', async () => {
        userRepositoryMock.findUserById.resolves(null);

        const result = await layoutService.getLayoutsByOwnerId(1);

        deepEqual(result, []);
        ok(userRepositoryMock.findUserById.calledWith(1));
      });

      test('should return empty array if user has no username', async () => {
        userRepositoryMock.findUserById.resolves({ id: 1 });

        const result = await layoutService.getLayoutsByOwnerId(1);

        deepEqual(result, []);
        ok(userRepositoryMock.findUserById.calledWith(1));
      });

      test('should throw error if userRepository throws', async () => {
        const error = new Error('User repository error');
        userRepositoryMock.findUserById.rejects(error);

        await rejects(
          () => layoutService.getLayoutsByOwnerId(1),
          error,
        );
      });
    });

    suite('getAllLayouts', () => {
      test('should call findAllLayouts if no filters are provided', async () => {
        const mockLayouts = [{ id: 1, name: 'L1' }];
        layoutRepositoryMock.findAllLayouts.resolves(mockLayouts);

        const result = await layoutService.getAllLayouts();

        deepEqual(result, mockLayouts);
        ok(layoutRepositoryMock.findAllLayouts.calledOnce);
        ok(layoutRepositoryMock.findByFilters.notCalled);
      });

      test('should call findByFilters if filters are provided', async () => {
        const filters = { owner_username: 'alice' };
        const mockLayouts = [{ id: 2, name: 'L2', owner_username: 'alice' }];
        layoutRepositoryMock.findByFilters = stub().resolves(mockLayouts);

        const result = await layoutService.getAllLayouts(filters);

        deepEqual(result, mockLayouts);
        ok(layoutRepositoryMock.findByFilters.calledOnceWith(filters));
        ok(layoutRepositoryMock.findAllLayouts.notCalled);
      });

      test('should throw error if findAllLayouts fails', async () => {
        const error = new Error('findAllLayouts failed');
        layoutRepositoryMock.findAllLayouts.rejects(error);

        await rejects(
          () => layoutService.getAllLayouts(),
          error,
        );
      });

      test('should throw error if findByFilters fails', async () => {
        const error = new Error('findByFilters failed');
        layoutRepositoryMock.findByFilters = stub().rejects(error);

        await rejects(
          () => layoutService.getAllLayouts({ owner_username: 'bob' }),
          error,
        );
      });
    });

    suite('getLayoutById', () => {
      test('should throw error if layout is not found', async () => {
        const layoutId = 1;
        layoutRepositoryMock.findLayoutById.resolves(null);

        await rejects(
          () => layoutService.getLayoutById(layoutId),
          new NotFoundError(`Layout with id: ${layoutId} not found`),
        );
        ok(layoutRepositoryMock.findLayoutById.calledWith(layoutId));
      });
      test('should return layout if found', async () => {
        const layoutId = 1;
        const mockLayout = { id: layoutId, name: 'Layout 1' };
        layoutRepositoryMock.findLayoutById.resolves(mockLayout);

        const result = await layoutService.getLayoutById(layoutId);

        deepEqual(result, mockLayout);
        ok(layoutRepositoryMock.findLayoutById.calledWith(layoutId));
      });
    });

    suite('getLayoutByName', () => {
      test('should throw error if layout name is not found', async () => {
        const layoutName = 'NonExistingLayout';
        layoutRepositoryMock.findLayoutByName.resolves(null);

        await rejects(
          () => layoutService.getLayoutByName(layoutName),
          new NotFoundError(`Layout with name: ${layoutName} not found`),
        );
      });
      test('should return layout if name found', async () => {
        const layoutName = 'ExistingLayout';
        const mockLayout = { id: 1, name: layoutName };
        layoutRepositoryMock.findLayoutByName.resolves(mockLayout);

        const result = await layoutService.getLayoutByName(layoutName);

        deepEqual(result, mockLayout);
      });
    });

    suite('getObjectById', () => {
      test('should throw an error if chart is not found', async () => {
        const chartId = 1;
        gridTabCellRepositoryMock.findObjectByChartId.resolves(null);

        await rejects(
          () => layoutService.getObjectById(chartId),
          new NotFoundError(`Chart with id: ${chartId} not found`),
        );
      });
      test('should return object if found', async () => {
        const mockChart = {
          object_name: 'Chart 1',
          ignore_defaults: false,
          chartOptions: [],
        };
        const mockedLayout = {
          name: 'Layout 1',
        };
        const mockFoundObject = {
          tab: {
            name: 'Tab 1',
            layout: mockedLayout,
          },
          chart: mockChart,
        };
        gridTabCellRepositoryMock.findObjectByChartId.resolves(mockFoundObject);
        ok(
          await layoutService.getObjectById(1),
          deepEqual(mockFoundObject, {
            tab: { name: 'Tab 1', layout: mockedLayout },
            chart: mockChart,
          }),
        );
        ok(gridTabCellRepositoryMock.findObjectByChartId.calledWith(1));
      });
    });

    suite('updateLayout', () => {
      test('should apply update if updating layout', async () => {
        const layoutId = 1;
        const patch = {
          name: 'Updated Layout',
          owner_id: 42,
          tabs: [{ id: 100, title: 'Tab A' }],
        };
        const existingLayout = { id: layoutId, name: 'Old Layout' };

        userRepositoryMock.findUserById.resolves({ username: 'testuser' });
        layoutRepositoryMock.findLayoutById.resolves(existingLayout);
        layoutRepositoryMock.updateLayout.resolves();
        tabRepositoryMock.updateTab = stub().resolves();
        layoutService._updateTabs = stub().resolves(); // Stub internal call

        const result = await layoutService.updateLayout(layoutId, patch);

        strictEqual(result, layoutId);
        ok(layoutRepositoryMock.updateLayout.calledOnce);
        ok(layoutService._updateTabs.calledWith(layoutId, patch.tabs));
      });
      test('should apply patch if patching layout', async () => {
        const layoutId = 2;
        const patch = { description: 'Patched desc' };
        const existingLayout = { id: layoutId, description: 'Old desc' };

        layoutRepositoryMock.findLayoutById.resolves(existingLayout);
        layoutRepositoryMock.updateLayout.resolves();

        const result = await layoutService.patchLayout(layoutId, patch);

        strictEqual(result, layoutId);
        ok(layoutRepositoryMock.updateLayout.calledOnceWith(layoutId, { description: 'Patched desc' }));
      });
      test('should normalize layout correctly for full update', async () => {
        const layoutId = 3;
        const patch = {
          name: 'Normalized Name',
          description: 'Normalized Desc',
          displayTimestamp: true,
          autoTabChange: 30,
          isOfficial: true,
          owner_id: 99,
        };
        const existingLayout = { id: layoutId };

        userRepositoryMock.findUserById.resolves({ username: 'admin' });
        layoutRepositoryMock.findLayoutById.resolves(existingLayout);
        layoutRepositoryMock.updateLayout = stub().resolves();
        layoutService._updateTabs = stub().resolves();

        const result = await layoutService.updateLayout(layoutId, patch);

        strictEqual(result, layoutId);
        const [, updateArgs] = layoutRepositoryMock.updateLayout.getCall(0).args;
        deepEqual(updateArgs, {
          name: 'Normalized Name',
          description: 'Normalized Desc',
          display_timestamp: true,
          auto_tab_change_interval: 30,
          is_official: true,
          owner_username: 'admin',
        });
      });
      test('should throw and log if normalization fails (bad owner_id)', async () => {
        const layoutId = 4;
        const patch = { owner_id: 123 };
        const existingLayout = { id: layoutId };

        userRepositoryMock.findUserById.rejects(new Error('User not found'));
        layoutRepositoryMock.findLayoutById.resolves(existingLayout);

        await rejects(() => layoutService.updateLayout(layoutId, patch), /User not found/);
      });
    });
    suite('createLayout', () => {
      test('should throw an error if layout owner is not found', async () => {
        const newLayout = {
          id: 1,
          name: 'Layout 1',
          description: 'Description 1',
          displayTimestamp: '2025-04-01',
          autoTabChange: 5,
          isOfficial: true,
          owner_id: 999, // Non-existing owner
          tabs: [],
        };

        userRepositoryMock.findUserById.resolves(null); // Simulating owner not found

        try {
          await layoutService.createLayout(newLayout);
        } catch (error) {
          ok(error.message === 'Layout owner not found');
        }
      });
      test('should create layout and associated data (tabs, objects, charts, options)', async () => {
        const newLayout = {
          id: 1,
          name: 'Layout 1',
          description: 'Description 1',
          displayTimestamp: '2025-04-01',
          autoTabChange: 5,
          isOfficial: true,
          owner_id: 1,
          tabs: [
            {
              id: 1,
              name: 'Tab 1',
              columns: 3,
              objects: [
                {
                  id: 1,
                  x: 0,
                  y: 0,
                  h: 1,
                  w: 1,
                  name: 'Chart 1',
                  options: ['Option1'],
                  ignoreDefaults: false,
                },
              ],
            },
          ],
        };

        userRepositoryMock.findUserById.resolves({ id: 1, username: 'testuser' });
        layoutRepositoryMock.createLayout.resolves(newLayout);
        tabRepositoryMock.createTab.resolves();
        gridTabCellRepositoryMock.createGridTabCell.resolves();
        chartRepositoryMock.createChart.resolves();
        optionsRepositoryMock.findOptionByName.resolves({ id: 7 });
        chartOptionsRepositoryMock.createChartOption.resolves();

        const result = await layoutService.createLayout(newLayout);

        deepEqual(result, newLayout);

        ok(layoutRepositoryMock.createLayout.calledWith({
          id: 1,
          name: 'Layout 1',
          description: 'Description 1',
          display_timestamp: '2025-04-01',
          auto_tab_change_interval: 5,
          owner_username: 'testuser',
          is_official: true,
        }));

        ok(tabRepositoryMock.createTab.calledWith({
          id: 1,
          name: 'Tab 1',
          layout_id: 1,
          column_count: 3,
        }));

        ok(gridTabCellRepositoryMock.createGridTabCell.calledWith({
          chart_id: 1,
          row: 0,
          col: 0,
          row_span: 1,
          col_span: 1,
          tab_id: 1,
        }));

        ok(chartRepositoryMock.createChart.calledWith({
          id: 1,
          object_name: 'Chart 1',
          ignore_defaults: false,
        }));

        ok(optionsRepositoryMock.findOptionByName.calledWith('Option1'));
        ok(chartOptionsRepositoryMock.createChartOption.calledWith({
          chart_id: 1,
          option_id: 7,
        }));
      });
      test('should throw an error if an option is not found while creating layout', async () => {
        const newLayout = {
          id: 1,
          name: 'Layout 1',
          description: 'Description 1',
          displayTimestamp: '2025-04-01',
          autoTabChange: 5,
          isOfficial: true,
          owner_id: 1,
          tabs: [
            {
              id: 1,
              name: 'Tab 1',
              columns: 3,
              objects: [
                {
                  id: 1,
                  x: 0,
                  y: 0,
                  h: 1,
                  w: 1,
                  name: 'Chart 1',
                  options: ['NonExistingOption'],
                  ignoreDefaults: false,
                },
              ],
            },
          ],
        };

        userRepositoryMock.findUserById.resolves({ id: 1, username: 'testuser' });
        optionsRepositoryMock.findOptionByName.resolves(null); // Simulating option not found

        try {
          await layoutService.createLayout(newLayout);
        } catch (error) {
          ok(error.message === 'Option NonExistingOption not found');
        }
      });
    });
    suite('deleteLayout', () => {
      test('should delete layout and return its ID', async () => {
        layoutRepositoryMock.deleteLayout.resolves(1);

        const result = await layoutService.deleteLayout(123);

        strictEqual(result, 123);
        ok(layoutRepositoryMock.deleteLayout.calledWith(123));
      });

      test('should throw an error if layout is not found', async () => {
        const layoutId = 456;
        const expectedErrorMessage = 'Error from repository';

        layoutRepositoryMock.deleteLayout.rejects(new Error(expectedErrorMessage));

        await rejects(
          async () => await layoutService.deleteLayout(layoutId),
          (err) =>
            err instanceof Error &&
            err.message === expectedErrorMessage,
          'Expected deleteLayout to throw an Error with the correct message',
        );

        ok(layoutRepositoryMock.deleteLayout.calledWith(layoutId), 'Expected deleteLayout to be called with layoutId');
      });
    });
  });
};
