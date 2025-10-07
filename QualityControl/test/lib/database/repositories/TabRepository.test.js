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
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import sinon from 'sinon';
import { TabRepository } from '../../../../lib/database/repositories/TabRepository.js';

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
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
        bulkCreate: sinon.stub(),
      };
      tabRepository = new TabRepository(mockTabModel);
    });

    test('should create instance with tab model', () => {
      ok(tabRepository instanceof TabRepository);
      strictEqual(tabRepository.model, mockTabModel);
    });

    test('should inherit from BaseRepository', () => {
      ok(tabRepository.model);
    });

    test('should handle tab creation', async () => {
      const tabData = { layout_id: '1', name: 'Test Tab', order: 1 };
      const createdTab = { id: '1', ...tabData };
      mockTabModel.create.resolves(createdTab);

      const result = await tabRepository.model.create(tabData);
      deepStrictEqual(result, createdTab);
      ok(mockTabModel.create.calledWith(tabData));
    });

    test('should handle tab retrieval by layout', async () => {
      const mockTabs = [
        { id: '1', layout_id: '1', name: 'Tab 1', order: 1 },
        { id: '2', layout_id: '1', name: 'Tab 2', order: 2 },
      ];
      mockTabModel.findAll.resolves(mockTabs);

      const result = await tabRepository.model.findAll({ where: { layout_id: '1' } });
      deepStrictEqual(result, mockTabs);
      ok(mockTabModel.findAll.calledWith({ where: { layout_id: '1' } }));
    });

    test('should handle bulk tab creation', async () => {
      const tabsArray = [
        { layout_id: '1', name: 'Tab 1', order: 1 },
        { layout_id: '1', name: 'Tab 2', order: 2 },
      ];
      const createdTabs = tabsArray.map((tab, i) => ({ id: String(i + 1), ...tab }));
      mockTabModel.bulkCreate.resolves(createdTabs);

      const result = await tabRepository.model.bulkCreate(tabsArray);
      deepStrictEqual(result, createdTabs);
      ok(mockTabModel.bulkCreate.calledWith(tabsArray));
    });

    test('should handle tab updates', async () => {
      const updateData = { name: 'Updated Tab', order: 3 };
      const updateResult = [1];
      mockTabModel.update.resolves(updateResult);

      const result = await tabRepository.model.update(updateData, { where: { id: '1' } });
      deepStrictEqual(result, updateResult);
      ok(mockTabModel.update.calledWith(updateData, { where: { id: '1' } }));
    });

    test('should handle tab deletion by layout', async () => {
      mockTabModel.destroy.resolves(2);

      const result = await tabRepository.model.destroy({ where: { layout_id: '1' } });
      strictEqual(result, 2);
      ok(mockTabModel.destroy.calledWith({ where: { layout_id: '1' } }));
    });

    test('should handle single tab retrieval', async () => {
      const mockTab = { id: '1', layout_id: '1', name: 'Test Tab', order: 1 };
      mockTabModel.findByPk.resolves(mockTab);

      const result = await tabRepository.model.findByPk('1');
      deepStrictEqual(result, mockTab);
      ok(mockTabModel.findByPk.calledWith('1'));
    });
  });
};
