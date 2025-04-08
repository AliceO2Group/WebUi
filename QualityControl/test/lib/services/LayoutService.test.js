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
import { LogManager } from '@aliceo2/web-ui';
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
        findLayoutById: stub(),
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
        stub(layoutService, 'getAllLayouts');
        const mockLayouts = [
          { id: 1, name: 'Layout 1', owner_username: 'testuser' },
          { id: 2, name: 'Layout 2', owner_username: 'testuser' },
        ];
        userRepositoryMock.findUserById.resolves({ id: 1, username: 'testuser' });
        layoutService.getAllLayouts.resolves(mockLayouts);

        const result = await layoutService.getLayoutsByOwnerId(1);

        deepEqual(result, mockLayouts);
        ok(userRepositoryMock.findUserById.calledWith(1));
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
      });
      test('throw error if userRepository throws', async () => {
        const error = new Error('DB error');
        userRepositoryMock.findUserById.rejects(error);

        await rejects(
          async () => await layoutService.getLayoutsByOwnerId(1),
          error,
        );
      });
    });
    suite('getAllLayouts', () => {
      test('should return layouts when repository call succeeds', async () => {
        const filters = { owner_username: 'testuser' };
        const mockLayouts = [
          { id: 1, name: 'nameA', owner_username: 'testuser' },
          { id: 2, name: 'nameB', owner_username: 'testuser' },
        ];
        layoutRepositoryMock.findAllLayouts = stub().resolves(mockLayouts);

        const result = await layoutService.getAllLayouts(filters);

        deepEqual(result, mockLayouts);
        ok(layoutRepositoryMock.findAllLayouts.calledWith(filters));
      });

      test('should throw and log error if repository throws', async () => {
        const filters = { owner_username: 'failuser' };
        const error = new Error('DB error');
        layoutRepositoryMock.findAllLayouts.rejects(error);

        await rejects(
          async () => await layoutService.getAllLayouts(filters),
          error,
        );
      });
    });
    suite('getLayoutById', () => {
      suite('getLayoutById', () => {
        test('should return layout when found', async () => {
          const layoutId = 1;
          const mockLayout = { id: layoutId, name: 'Test Layout' };
          layoutRepositoryMock.findLayoutById = stub().resolves(mockLayout);

          const result = await layoutService.getLayoutById(layoutId);

          deepEqual(result, mockLayout);
          ok(layoutRepositoryMock.findLayoutById.calledWith(layoutId));
        });

        test('should throw error if layoutId is not provided', async () => {
          await rejects(
            async () => await layoutService.getLayoutById(null),
            new Error('Layout ID is required'),
          );
        });

        test('should throw error if layout is not found', async () => {
          const layoutId = 999;
          layoutRepositoryMock.findLayoutById.resolves(null);

          await rejects(
            async () => await layoutService.getLayoutById(layoutId),
            new Error(`Layout with ID ${layoutId} not found`),
          );

          ok(layoutRepositoryMock.findLayoutById.calledWith(layoutId));
        });

        test('should throw error from repository', async () => {
          const layoutId = 123;
          const error = new Error('DB exploded');
          layoutRepositoryMock.findLayoutById = stub().rejects(error);

          await rejects(
            async () => await layoutService.getLayoutById(layoutId),
            error,
          );
        });
      });
    });

    suite('getLayoutByName', () => {
      test('should return layout when found by name', async () => {
        const layoutName = 'Dashboard';
        const mockLayout = { id: 1, name: layoutName };
        layoutRepositoryMock.findLayoutByName = stub().resolves(mockLayout);

        const result = await layoutService.getLayoutByName(layoutName);

        deepEqual(result, mockLayout);
        ok(layoutRepositoryMock.findLayoutByName.calledWith(layoutName));
      });

      test('should throw error if layoutName is not provided', async () => {
        await rejects(
          async () => await layoutService.getLayoutByName(null),
          new Error('Layout name is required'),
        );
      });

      test('should throw error if layout is not found', async () => {
        const layoutName = 'NonExistentLayout';
        layoutRepositoryMock.findLayoutByName = stub().resolves(null);

        await rejects(
          async () => await layoutService.getLayoutByName(layoutName),
          new Error('Layout not found'),
        );

        ok(layoutRepositoryMock.findLayoutByName.calledWith(layoutName));
      });

      test('should log and rethrow error if repository throws', async () => {
        const layoutName = 'Broken';
        const error = new Error('Database failure');
        layoutRepositoryMock.findLayoutByName = stub().rejects(error);

        await rejects(
          async () => await layoutService.getLayoutByName(layoutName),
          error,
        );
      });
    });
    suite('getObjectById', () => {
      test('should throw an error if the object is not found by ID', async () => {
        const objectId = '123';

        gridTabCellRepositoryMock.findObjectByChartId.resolves(null);

        try {
          await layoutService.getObjectById(objectId);
        } catch (error) {
          ok(error.message === 'Object not found');
        }
      });
      test('should return the correct object if found by ID', async () => {
        const objectId = '123';
        const foundObject = {
          tab: { name: 'Tab 1', layout: { name: 'Layout 1' } },
          chart: { object_name: 'Chart 1', ignore_defaults: false, chartOptions: ['option1', 'option2'] },
        };

        gridTabCellRepositoryMock.findObjectByChartId.resolves(foundObject);

        const result = await layoutService.getObjectById(objectId);

        deepEqual(result, {
          layoutName: 'Layout 1',
          tabName: 'Tab 1',
          object: {
            name: 'Chart 1',
            options: ['option1', 'option2'],
            ignoreDefaults: false,
          },
        });
        ok(gridTabCellRepositoryMock.findObjectByChartId
          .calledWith(objectId));
      });
    });

    suite('updateLayout', () => {
      test('should throw an error if patchedLayout is missing or has no id', async () => {
        const invalidPatchedLayout = { name: 'New Layout', description: 'Test layout' };
        const layoutId = 1;

        try {
          await layoutService.updateLayout(layoutId, invalidPatchedLayout);
        } catch (error) {
          ok(error.message === 'Layout ID is required');
        }

        const missingPatchedLayout = null;

        try {
          await layoutService.updateLayout(layoutId, missingPatchedLayout);
        } catch (error) {
          ok(error.message === 'Layout ID is required');
        }
      });

      test('should throw an error if layout with given layoutId is not found', async () => {
        const layoutId = 1;
        const patchedLayout = {
          id: 1,
          name: 'Updated Layout',
          description: 'Updated description',
          displayTimestamp: '2025-04-08',
          autoTabChange: 3000,
          isOfficial: true,
          tabs: [],
          owner_id: 1,
        };

        layoutRepositoryMock.findLayoutById.resolves(null);

        try {
          await layoutService.updateLayout(layoutId, patchedLayout);
        } catch (error) {
          ok(error.message === `Layout with ID: ${layoutId} not found`);
        }
      });

      test('should throw an error if no rows are affected during layout update', async () => {
        const layoutId = 1;
        const patchedLayout = {
          id: 1,
          name: 'Updated Layout',
          description: 'Updated description',
          displayTimestamp: '2025-04-08',
          autoTabChange: 3000,
          isOfficial: true,
          tabs: [],
          owner_id: 1,
        };

        const foundLayout = { id: 1, name: 'Old Layout' };
        const layoutOwner = { username: 'ownerUser' };

        layoutRepositoryMock.findLayoutById.resolves(foundLayout);
        userRepositoryMock.findUserById.resolves(layoutOwner);
        layoutRepositoryMock.updateLayout.resolves(0);

        try {
          await layoutService.updateLayout(layoutId, patchedLayout);
        } catch (error) {
          ok(error.message === 'Layout not found (or not changes made)');
        }
      });

      test('should update layout and its tabs if layout exists', async () => {
        const layoutId = 1;
        const patchedLayout = {
          id: 1,
          name: 'Updated Layout',
          description: 'Updated description',
          displayTimestamp: '2025-04-08',
          autoTabChange: 3000,
          isOfficial: true,
          tabs: [{ id: 1, name: 'Tab 1', objects: [] }],
          owner_id: 1,
        };

        const foundLayout = { id: 1, name: 'Old Layout' }; // Simulating layout exists
        const layoutOwner = { username: 'ownerUser' }; // Simulating layout owner

        layoutRepositoryMock.findLayoutById.resolves(foundLayout);
        userRepositoryMock.findUserById.resolves(layoutOwner);
        layoutRepositoryMock.updateLayout.resolves(1); // Simulating successful update
        layoutService._updateTabs = stub().resolves(); // Stub _updateTabs method

        await layoutService.updateLayout(layoutId, patchedLayout);

        ok(layoutRepositoryMock.updateLayout.calledWith(layoutId, {
          id: layoutId,
          name: patchedLayout.name,
          description: patchedLayout.description,
          display_timestamp: patchedLayout.displayTimestamp,
          auto_tab_change_interval: patchedLayout.autoTabChange,
          owner_username: layoutOwner.username,
          is_official: patchedLayout.isOfficial,
        }));
        ok(layoutService._updateTabs.calledWith(layoutId, patchedLayout.tabs));
      });

      test('should update, create, and delete tabs correctly', async () => {
        const layoutId = 1;
        const tabs = [
          { id: 1, name: 'Tab 1', columns: 3, objects: [] },
          { id: 2, name: 'Tab 2', columns: 2, objects: [] },
        ];

        tabRepositoryMock.findTabsByLayoutId
          .resolves([{ id: 1, name: 'Tab 1', layout_id: layoutId, column_count: 3 }]);

        tabRepositoryMock.updateTab.resolves();
        tabRepositoryMock.createTab.resolves();
        tabRepositoryMock.deleteTab.resolves();

        layoutService._updateCells = stub().resolves();

        await layoutService._updateTabs(layoutId, tabs);

        ok(tabRepositoryMock.updateTab
          .calledWith({ name: 'Tab 1', layout_id: layoutId, column_count: 3 }, 1));
        ok(tabRepositoryMock.createTab
          .calledWith({ id: 2, name: 'Tab 2', layout_id: layoutId, column_count: 2 }));

        ok(tabRepositoryMock.deleteTab.notCalled);

        ok(layoutService._updateCells.calledWith(2, []));
      });

      test('should update and create cells and options correctly', async () => {
        const tabId = 1;
        const objects = [
          { id: 1, x: 0, y: 0, h: 1, w: 1, name: 'Chart 1', options: [{ name: 'Option1' }], ignoreDefaults: false },
          { id: 2, x: 1, y: 1, h: 2, w: 2, name: 'Chart 2', options: [{ name: 'Option2' }], ignoreDefaults: true },
        ];

        gridTabCellRepositoryMock.findByTabId
          .resolves([{ chart_id: 1, id: 1, tab_id: 1 }]);
        chartRepositoryMock.updateChart.resolves();
        chartRepositoryMock.createChart.resolves();
        gridTabCellRepositoryMock.updateGridTabCell.resolves();
        gridTabCellRepositoryMock.createGridTabCell.resolves();
        optionsRepositoryMock.findOptionByName
          .onCall(0).resolves({ id: 7 })
          .onCall(1).resolves({ id: 9 });

        await layoutService._updateCells(tabId, objects);

        ok(chartRepositoryMock.updateChart.calledWith({
          id: 1, object_name: 'Chart 1', ignore_defaults: false,
        }, 1));
        ok(chartRepositoryMock.createChart.calledWith({
          id: 2, object_name: 'Chart 2', ignore_defaults: true,
        }));

        ok(gridTabCellRepositoryMock.updateGridTabCell.calledWith({
          chart_id: 1, row: 0, col: 0, row_span: 1, col_span: 1, tab_id: tabId,
        }, { chart_id: 1, tab_id: tabId }));
        ok(gridTabCellRepositoryMock.createGridTabCell.calledWith({
          chart_id: 2, row: 1, col: 1, row_span: 2, col_span: 2, tab_id: tabId,
        }));

        ok(optionsRepositoryMock.findOptionByName.calledWith({ name: 'Option1' }));
        ok(optionsRepositoryMock.findOptionByName.calledWith({ name: 'Option2' }));
      });

      suite('_updateOptions', () => {
        const chartId = 1;
        const options = ['option1', 'option2'];
        const existingChartOptions = [{ option_id: 7 }, { option_id: 9 }];

        beforeEach(() => {
          chartOptionsRepositoryMock.findChartOptionsByChartId = stub().resolves(existingChartOptions);
          optionsRepositoryMock.findOptionByName
            .onCall(0).resolves({ id: 7 })
            .onCall(1).resolves({ id: 8 });
          chartOptionsRepositoryMock.updateChartOption.resolves();
          chartOptionsRepositoryMock.createChartOption.resolves();
          chartOptionsRepositoryMock.deleteChartOption.resolves();
        });

        test('should update existing options and create new ones', async () => {
          await layoutService._updateOptions(chartId, options);
          ok(chartOptionsRepositoryMock.updateChartOption.calledWith({ chartId: 1, optionId: 7 }));
          ok(chartOptionsRepositoryMock.createChartOption.calledWith({ chart_id: 1, option_id: 8 }));
        });

        test('should delete not selected options', async () => {
          await layoutService._updateOptions(chartId, options);
          ok(chartOptionsRepositoryMock.deleteChartOption.calledWith(chartId, 9));
        });
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
        layoutRepositoryMock.deleteLayout.resolves(0);

        await rejects(() => layoutService.deleteLayout(456), {
          message: 'Layout with id: 456 not found',
        });

        ok(layoutRepositoryMock.deleteLayout.calledWith(456));
      });
    });
  });
};
