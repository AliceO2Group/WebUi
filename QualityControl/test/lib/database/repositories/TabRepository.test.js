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

import { ok, rejects, doesNotThrow } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { TabRepository } from '../../../../lib/database/repositories/TabRepository.js';
import { LogManager } from '@aliceo2/web-ui';

export const tabRepositoryTestSuite = async () => {
  let tabModelMock = null;
  let layoutModelMock = null;
  let loggerMock = null;
  let repository = null;

  beforeEach(() => {
    tabModelMock = {
      findAll: sinon.stub(),
      findByPk: sinon.stub(),
      findOne: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub(),
    };
    layoutModelMock = {};
    loggerMock = { errorMessage: sinon.stub() };

    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }

    repository = new TabRepository(tabModelMock, layoutModelMock);
    repository._logger = loggerMock;
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('findTabsByLayoutId', () => {
    test('should find tabs by layout ID', async () => {
      const layoutId = 1;
      const tabs = [{ id: 1, name: 'Tab 1' }];
      tabModelMock.findAll.resolves(tabs);

      const result = await repository.findTabsByLayoutId(layoutId);
      ok(result === tabs);
      ok(tabModelMock.findAll.calledWith({ where: { layout_id: layoutId } }));
    });

    test('should throw an error if search fails', async () => {
      const layoutId = 1;
      const error = new Error('Search failed');
      tabModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findTabsByLayoutId(layoutId),
        error,
      );
    });
  });

  suite('findTabById', () => {
    test('should find a tab by its ID', async () => {
      const tabId = 1;
      const tab = { id: tabId, name: 'Tab 1' };
      tabModelMock.findByPk.resolves(tab);

      const result = await repository.findTabById(tabId);
      ok(result === tab);
      ok(tabModelMock.findByPk.calledWith(tabId));
    });

    test('should throw an error if search fails', async () => {
      const tabId = 1;
      const error = new Error('Search failed');
      tabModelMock.findByPk.rejects(error);

      await rejects(
        async () => await repository.findTabById(tabId),
        error,
      );
    });
  });

  suite('createTab', () => {
    test('should save a new tab', async () => {
      const tabData = { name: 'New Tab' };
      const createdTab = { id: 1, ...tabData };
      tabModelMock.create.resolves(createdTab);

      const result = await repository.createTab(tabData);
      ok(result === createdTab);
      ok(tabModelMock.create.calledWith(tabData));
    });

    test('should throw an error if creation fails', async () => {
      const tabData = { name: 'New Tab' };
      const error = new Error('Creation failed');
      tabModelMock.create.rejects(error);

      await rejects(
        async () => await repository.createTab(tabData),
        error,
      );
    });
  });

  suite('updateTab', () => {
    test('should update a tab successfully', async () => {
      const tabId = 1;
      const updateData = { name: 'Updated Tab' };
      tabModelMock.update.resolves([1]);

      await doesNotThrow(async () => {
        await repository.updateTab(updateData, tabId);
      });
      ok(tabModelMock.update.calledWith(updateData, { where: { id: tabId } }));
    });

    test('should throw an error if no rows are affected (tab not found)', async () => {
      const tabId = 1;
      const updateData = { name: 'Updated Tab' };
      tabModelMock.update.resolves([0]);

      await rejects(
        async () => await repository.updateTab(updateData, tabId),
        new Error('Tab not found or no changes made'),
      );
    });

    test('should throw an error if update fails', async () => {
      const tabId = 1;
      const updateData = { name: 'Updated Tab' };
      const error = new Error('Update failed');
      tabModelMock.update.rejects(error);

      await rejects(
        async () => await repository.updateTab(updateData, tabId),
        error,
      );
    });
  });

  suite('deleteTab', () => {
    test('should delete a tab successfully', async () => {
      const tabId = 1;
      tabModelMock.destroy.resolves(1);

      await doesNotThrow(async () => {
        await repository.deleteTab(tabId);
      });
      ok(tabModelMock.destroy.calledWith({ where: { id: tabId } }));
    });

    test('should throw an error if no rows are deleted (tab not found)', async () => {
      const tabId = 1;
      tabModelMock.destroy.resolves(0);

      await rejects(
        async () => await repository.deleteTab(tabId),
        new Error('Tab not found'),
      );
    });

    test('should throw an error if deletion fails', async () => {
      const tabId = 1;
      const error = new Error('Deletion failed');
      tabModelMock.destroy.rejects(error);

      await rejects(
        async () => await repository.deleteTab(tabId),
        error,
      );
    });
  });
};
