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

import { suite, test, beforeEach } from 'node:test';
import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert';
import { stub } from 'sinon';
import { TabRepository } from '../../../../lib/database/repositories/TabRepository.js';
import { UniqueConstraintError } from 'sequelize';

/**
 * Test suite for TabRepository
 */
export const tabRepositoryTestSuite = () => {
  suite('TabRepository', () => {
    let mockTabModel = null;
    let tabRepository = null;

    beforeEach(() => {
      mockTabModel = {
        name: 'Tab',
        findAll: stub(),
        findByPk: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
        findOne: stub(),
        bulkCreate: stub(),
      };
      tabRepository = new TabRepository(mockTabModel);
    });

    test('should initialize with the correct model', () => {
      strictEqual(tabRepository.model, mockTabModel);
    });

    test('should find tabs by layout ID', async () => {
      const layoutId = 1;
      const expectedResult = [
        { id: 1, layout_id: layoutId, name: 'Tab 1' },
        { id: 2, layout_id: layoutId, name: 'Tab 2' },
      ];
      mockTabModel.findAll.resolves(expectedResult);

      const result = await tabRepository.findTabsByLayoutId(layoutId);

      deepStrictEqual(result, expectedResult);
      ok(mockTabModel.findAll.calledOnceWithExactly({
        include: [],
        where: { layout_id: layoutId },
      }));
    });

    test('should create a new tab', async () => {
      const newTabData = { layout_id: 1, name: 'New Tab' };
      const createdTab = { id: 1, ...newTabData };
      mockTabModel.create.resolves(createdTab);

      const result = await tabRepository.createTab(newTabData);

      deepStrictEqual(result, createdTab);
      ok(mockTabModel.create.calledOnceWithExactly(newTabData, {}));
    });

    test('should throw an invalid input error when creating a tab with duplicate name', async () => {
      const newTabData = { layout_id: 1, name: 'Duplicate Tab' };
      const uniqueConstraintError = new UniqueConstraintError();
      mockTabModel.create.rejects(uniqueConstraintError);

      await rejects(
        async () => {
          await tabRepository.createTab(newTabData);
        },
        (error) => {
          strictEqual(
            error.message,
            `A tab with name "${newTabData.name}" already exists for layout ID "${newTabData.layout_id}".`,
          );
          return true;
        },
      );
      ok(mockTabModel.create.calledOnceWithExactly(newTabData, {}));
    });

    test('should update an existing tab', async () => {
      const tabId = 1;
      const updateData = { name: 'Updated Tab' };
      mockTabModel.update.resolves(1);

      const result = await tabRepository.updateTab(tabId, updateData);

      strictEqual(result, 1);
      ok(mockTabModel.update.calledOnceWithExactly(updateData, { where: { id: tabId } }));
    });

    test('should throw an invalid input error when updating a tab with duplicate name', async () => {
      const tabId = 1;
      const updateData = { name: 'Duplicate Tab' };
      const uniqueConstraintError = new UniqueConstraintError();
      mockTabModel.update.rejects(uniqueConstraintError);

      await rejects(
        async () => {
          await tabRepository.updateTab(tabId, updateData);
        },
        (error) => {
          strictEqual(
            error.message,
            `A tab with name "${updateData.name}" already exists for layout ID "${updateData.layout_id}".`,
          );
          return true;
        },
      );
      ok(mockTabModel.update.calledOnceWithExactly(updateData, { where: { id: tabId } }));
    });
  });
};
