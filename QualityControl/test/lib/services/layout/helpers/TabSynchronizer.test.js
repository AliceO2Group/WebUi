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

import { TabSynchronizer } from '../../../../../lib/services/layout/helpers/tabSynchronizer.js';

export const tabSynchronizerTestSuite = async () => {
  suite('TabSynchronizer Test Suite', () => {
    let mockTabRepository = null;
    let mockGridTabCellSynchronizer = null;
    let mockTransaction = null;
    let synchronizer = null;

    beforeEach(() => {
      mockTabRepository = {
        findTabsByLayoutId: () => Promise.resolve([]),
        deleteTab: () => Promise.resolve(1),
        updateTab: () => Promise.resolve(1),
        createTab: () => Promise.resolve({ id: 1 }),
        findTabById: () => Promise.resolve({ id: 1 }),
      };

      mockGridTabCellSynchronizer = {
        sync: () => Promise.resolve(),
      };

      mockTransaction = { id: 'mock-transaction', rollback: () => {} };
      synchronizer = new TabSynchronizer(mockTabRepository, mockGridTabCellSynchronizer);
    });

    suite('Constructor', () => {
      test('should successfully initialize TabSynchronizer', () => {
        const tabRepo = { test: 'tabRepo' };
        const gridSync = { test: 'gridSync' };
        const sync = new TabSynchronizer(tabRepo, gridSync);

        strictEqual(sync._tabRepository, tabRepo);
        strictEqual(sync._gridTabCellSynchronizer, gridSync);
        strictEqual(typeof sync._logger, 'object');
      });
    });

    suite('sync() method', () => {
      test('should create new tabs when none exist', async () => {
        const layoutId = 'layout-1';
        const tabs = [{ name: 'New Tab', objects: [] }];
        const createdTabs = [];

        mockTabRepository.findTabsByLayoutId = () => Promise.resolve([]);
        mockTabRepository.createTab = (tab) => {
          createdTabs.push(tab);
          return Promise.resolve({ id: 1 });
        };

        await synchronizer.sync(layoutId, tabs, mockTransaction);

        strictEqual(createdTabs.length, 1);
        strictEqual(createdTabs[0].layout_id, layoutId);
      });

      test('should update existing tabs', async () => {
        const layoutId = 'layout-1';
        const tabs = [{ id: 1, name: 'Updated Tab', objects: [] }];
        const updatedTabs = [];

        mockTabRepository.findTabsByLayoutId = () => Promise.resolve([{ id: 1 }]);
        mockTabRepository.updateTab = (id, tab) => {
          updatedTabs.push({ id, tab });
          return Promise.resolve(1);
        };

        await synchronizer.sync(layoutId, tabs, mockTransaction);

        strictEqual(updatedTabs.length, 1);
        strictEqual(updatedTabs[0].id, 1);
        strictEqual(updatedTabs[0].tab.layout_id, layoutId);
      });

      test('should delete tabs that are no longer present', async () => {
        const layoutId = 'layout-1';
        const tabs = [{ id: 2, name: 'Keep Tab' }];
        const deletedTabs = [];

        mockTabRepository.findTabsByLayoutId = () => Promise.resolve([
          { id: 1 }, // Should be deleted
          { id: 2 }, // Should remain
        ]);
        mockTabRepository.deleteTab = (id) => {
          deletedTabs.push(id);
          return Promise.resolve(1);
        };
        mockTabRepository.updateTab = () => Promise.resolve(1);

        await synchronizer.sync(layoutId, tabs, mockTransaction);

        strictEqual(deletedTabs.length, 1);
        strictEqual(deletedTabs[0], 1);
      });

      test('should sync grid tab cells when tab has objects', async () => {
        const layoutId = 'layout-1';
        const tabs = [{ id: 1, name: 'Tab with objects', objects: [{ id: 'obj1' }] }];
        const syncCalls = [];

        mockTabRepository.findTabsByLayoutId = () => Promise.resolve([{ id: 1 }]);
        mockTabRepository.updateTab = () => Promise.resolve(1);
        mockGridTabCellSynchronizer.sync = (tabId, objects, transaction) => {
          syncCalls.push({ tabId, objects });
          return Promise.resolve();
        };

        await synchronizer.sync(layoutId, tabs, mockTransaction);

        strictEqual(syncCalls.length, 1);
        strictEqual(syncCalls[0].tabId, 1);
        strictEqual(syncCalls[0].objects.length, 1);
      });

      test('should throw error and rollback when operation fails', async () => {
        const layoutId = 'layout-1';
        const tabs = [{ name: 'New Tab' }];
        const error = new Error('Database error');
        let rollbackCalled = false;

        mockTabRepository.findTabsByLayoutId = () => Promise.resolve([]);
        mockTabRepository.createTab = () => Promise.reject(error);
        mockTransaction.rollback = () => {
          rollbackCalled = true;
        };

        await rejects(
          async () => await synchronizer.sync(layoutId, tabs, mockTransaction),
          error
        );
        strictEqual(rollbackCalled, true, 'Transaction should be rolled back on error');
      });
    });
  });
};