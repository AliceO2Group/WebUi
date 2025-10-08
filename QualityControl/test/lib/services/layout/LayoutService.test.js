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

import { rejects, strictEqual } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';

import { LayoutService } from '../../../../lib/services/layout/LayoutService.js';
import { NotFoundError } from '@aliceo2/web-ui';
import { stub } from 'sinon';
import * as layoutMapper from '../../../../lib/services/layout/helpers/layoutMapper.js';

export const layoutServiceTestSuite = async () => {
  suite('LayoutService Test Suite', () => {
    let layoutService = null;
    let layoutRepositoryMock = null;
    let gridTabCellRepositoryMock = null;
    let userServiceMock = null;
    let tabSynchronizerMock = null;
    const transactionMock = { commit: stub().resolves(), rollback: stub().resolves() };

    beforeEach(() => {
      layoutRepositoryMock = {
        findById: stub(),
        findOne: stub(),
        model: { sequelize: { transaction: stub().resolves() } },
        updateLayout: stub(),
        createLayout: stub(),
        delete: stub(),
      };
      userServiceMock = { getUsernameById: stub() };
      tabSynchronizerMock = { sync: stub() };
      gridTabCellRepositoryMock = {
        findObjectByChartId: stub(),
      };
      layoutService = new LayoutService(
        layoutRepositoryMock,
        gridTabCellRepositoryMock,
        userServiceMock,
        tabSynchronizerMock,
      );
    });

    suite('getLayoutById', () => {
      test('should return layout when found by id', async () => {
        const layoutData = { id: 1, name: 'Test Layout' };
        layoutRepositoryMock.findById.resolves(layoutData);
        layoutRepositoryMock.findOne.resolves(null);

        const result = await layoutService.getLayoutById(1);
        strictEqual(result, layoutData);
      });

      test('should return layout when found by old_id', async () => {
        const layoutData = { id: 2, name: 'Old Layout' };
        layoutRepositoryMock.findById.resolves(null);
        layoutRepositoryMock.findOne.resolves(layoutData);
        const result = await layoutService.getLayoutById('old-123');
        strictEqual(result, layoutData);
      });

      test ('should throw NotFoundError when layout not found', async () => {
        layoutRepositoryMock.findById.resolves(null);
        layoutRepositoryMock.findOne.resolves(null);
        await rejects(async () => {
          await layoutService.getLayoutById(999);
        }, new NotFoundError('Layout with id: 999 was not found'));
      });
    });
    suite('getLayoutsByFilters', () => {
      test('should return layouts matching filters', async () => {
        const filters = { is_official: true };
        const layoutsData = [
          { id: 1, name: 'Official Layout 1', is_official: true },
          { id: 2, name: 'Official Layout 2', is_official: true },
        ];
        layoutRepositoryMock.findLayoutsByFilters = stub().resolves(layoutsData);

        const result = await layoutService.getLayoutsByFilters(filters);
        strictEqual(result, layoutsData);
      });

      test('should add owner_username to filters when owner_id is provided', async () => {
        const filters = { owner_id: 42 };
        const updatedFilters = { owner_username: 'johndoe' };
        const layoutsData = [{ id: 3, name: 'User Layout', owner_username: 'johndoe' }];
        userServiceMock.getUsernameById.resolves('johndoe');
        layoutRepositoryMock.findLayoutsByFilters = stub().resolves(layoutsData);
        layoutService._userService = userServiceMock;

        const result = await layoutService.getLayoutsByFilters(filters);
        strictEqual(result, layoutsData);
        strictEqual(layoutRepositoryMock.findLayoutsByFilters.calledWith(updatedFilters), true);
      });

      test('should throw error if userService fails to get username', async () => {
        const filters = { owner_id: 99 };
        userServiceMock.getUsernameById.rejects(new Error('User not found'));
        layoutService._userService = userServiceMock;

        await rejects(async () => {
          await layoutService.getLayoutsByFilters(filters);
        }, new Error('User not found'));
      });
    });
    suite('getObjectById', () => {
      test('should return object when found by id', async () => {
        const objectData = { id: 1, name: 'Test Object' };
        gridTabCellRepositoryMock.findObjectByChartId.resolves(objectData);

        const result = await layoutService.getObjectById(1);
        strictEqual(result, objectData);
      });

      test('should throw NotFoundError when object not found', async () => {
        gridTabCellRepositoryMock.findObjectByChartId.resolves(null);
        await rejects(async () => {
          await layoutService.getObjectById(999);
        }, new NotFoundError('Object with id: 999 was not found'));
      });
    });
    suite('putLayout', () => {
      test('putLayout should update layout when it exists', async () => {
        const updatedData = {
          id: 123456,
          autoTabChange: 0,
          collaborators: [],
          description: 'Updated description',
          displayTimestamp: true,
          name: 'Updated Layout',
          ownerUsername: 'alice_username',
          tabs: [{ id: 1, name: 'Tab Updated' }],
        };
        const normalizedLayout = {
          name: 'Updated Layout',
          description: 'Updated description',
          display_timestamp: true,
          auto_tab_change_interval: 0,
          owner_username: 'alice_username',
        };
        layoutRepositoryMock.findById.resolves({
          id: 123456,
          name: 'Old Layout',
          tabs: [{ id: 1, name: 'Tab 1' }],
        });
        layoutRepositoryMock.updateLayout.resolves(1);
        tabSynchronizerMock.sync.resolves();
        const result = await layoutService.putLayout(123456, updatedData);
        strictEqual(result, 123456);
        strictEqual(layoutRepositoryMock.updateLayout.calledWith(123456, normalizedLayout), true);
        strictEqual(tabSynchronizerMock.sync.calledWith(123456, updatedData.tabs), true);
        strictEqual(transactionMock.commit.called, true);
        strictEqual(transactionMock.rollback.called, false);
      });
      test('putLayout should throw NotFoundError when layout does not exist', async () => {
        layoutRepositoryMock.findById.resolves(null);
        await rejects(async () => {
          await layoutService.putLayout(999, { name: 'Nonexistent Layout' });
        }, new NotFoundError('Layout with id 999 not found'));
        strictEqual(transactionMock.rollback.called, true);
        strictEqual(transactionMock.commit.called, false);
      });

      test('putLayout should rollback transaction on error', async () => {
        layoutRepositoryMock.findById.resolves({ id: 123, name: 'Existing Layout' });
        layoutRepositoryMock.updateLayout.rejects(new Error('DB error'));
        await rejects(async () => {
          await layoutService.putLayout(123, { name: 'Updated Layout' });
        }, new Error('DB error'));
        strictEqual(transactionMock.rollback.called, true);
        strictEqual(transactionMock.commit.called, false);
      });
    });

    suite('patchLayout', () => {
      test('should patch layout when it exists', async () => {
        const updateData = {
          isOfficial: true,
        };
        const normalizedLayout = {
          is_official: true,
        };
        layoutRepositoryMock.findById.resolves({
          id: 123456,
          name: 'Old Layout',
          is_official: false,
          tabs: [{ id: 1, name: 'Tab 1' }],
        });
        layoutRepositoryMock.updateLayout.resolves(1);
        tabSynchronizerMock.sync.resolves();
        const normalizeLayoutStub = stub(layoutMapper, 'normalizeLayout').resolves(normalizedLayout);

        await layoutService.patchLayout(123456, updateData);
        strictEqual(layoutRepositoryMock.updateLayout.calledWith(123456, normalizedLayout), true);
        strictEqual(tabSynchronizerMock.sync.called, false);
        strictEqual(transactionMock.commit.called, true);
        strictEqual(transactionMock.rollback.called, false);
        normalizeLayoutStub.restore();
      });
      test('should throw NotFoundError when layout to patch does not exist', async () => {
        layoutRepositoryMock.findById.resolves({ id: 123, name: 'Existing Layout' });
        layoutRepositoryMock.updateLayout.resolves(0);
        await rejects(async () => {
          await layoutService.patchLayout(999, { name: 'Nonexistent Layout' });
        }, new NotFoundError('Layout with id 999 not found'));
        strictEqual(transactionMock.rollback.called, true);
        strictEqual(transactionMock.commit.called, false);
      });

      test('should rollback transaction on error during patch', async () => {
        layoutRepositoryMock.findById.resolves({ id: 123, name: 'Existing Layout' });
        layoutRepositoryMock.updateLayout.rejects(new Error('DB error'));
        await rejects(async () => {
          await layoutService.patchLayout(123, { name: 'Updated Layout' });
        }, new Error('DB error'));
        strictEqual(transactionMock.rollback.called, true);
        strictEqual(transactionMock.commit.called, false);
      });
    });
    suite('removeLayout', () => {
      test('should remove layout when it exists', async () => {
        layoutRepositoryMock.delete.resolves(1);
        await layoutService.removeLayout(123);
        strictEqual(layoutRepositoryMock.delete.calledWith(123), true);
      });

      test('should throw NotFoundError when layout to remove does not exist', async () => {
        layoutRepositoryMock.delete.resolves(0);
        await rejects(async () => {
          await layoutService.removeLayout(999);
        }, new NotFoundError('Layout with id 999 not found'));
      });
    });
    suite('postLayout', () => {
      test('should create new layout', async () => {
        const layoutData = {
          name: 'New Layout',
          description: 'Layout Description',
          displayTimestamp: true,
          autoTabChange: 5,
          ownerUsername: 'alice_username',
          tabs: [{ name: 'Tab 1' }],
        };
        const normalizedLayout = {
          name: 'New Layout',
          description: 'Layout Description',
          display_timestamp: true,
          auto_tab_change_interval: 5,
          owner_username: 'alice_username',
        };
        const createdLayout = { id: 1, ...normalizedLayout };
        layoutRepositoryMock.createLayout.resolves(createdLayout);
        tabSynchronizerMock.sync.resolves();
        const normalizeLayoutStub = stub(layoutMapper, 'normalizeLayout').resolves(normalizedLayout);

        const result = await layoutService.postLayout(layoutData);
        strictEqual(result, createdLayout);
        strictEqual(layoutRepositoryMock.createLayout.calledWith(normalizedLayout), true);
        strictEqual(tabSynchronizerMock.sync.calledWith(createdLayout.id, layoutData.tabs), true);
        strictEqual(transactionMock.commit.called, true);
        strictEqual(transactionMock.rollback.called, false);
        normalizeLayoutStub.restore();
      });
      test('should rollback transaction on error during layout creation', async () => {
        layoutRepositoryMock.createLayout.rejects(new Error('DB error'));
        await rejects(async () => {
          await layoutService.postLayout({ name: 'New Layout' });
        }, new Error('Failed to create new layout'));
        strictEqual(transactionMock.rollback.called, true);
        strictEqual(transactionMock.commit.called, false);
      });
    });
  });
};
