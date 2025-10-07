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
import { LayoutRepository } from '../../../../lib/database/repositories/LayoutRepository.js';
import { Op } from 'sequelize';

/**
 * Test suite for LayoutRepository
 */
export const layoutRepositoryTestSuite = () => {
  suite('LayoutRepository', () => {
    let mockLayoutModel = null;
    let layoutRepository = null;

    beforeEach(() => {
      mockLayoutModel = {
        name: 'Layout',
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
      };
      layoutRepository = new LayoutRepository(mockLayoutModel);
    });

    test('should create instance with layout model', () => {
      ok(layoutRepository instanceof LayoutRepository);
      strictEqual(layoutRepository.model, mockLayoutModel);
    });

    test('should find layout by ID', async () => {
      const mockLayout = { id: '1', name: 'Test Layout' };
      mockLayoutModel.findByPk.resolves(mockLayout);

      const result = await layoutRepository.findLayoutById('1');

      deepStrictEqual(result, mockLayout);
      ok(mockLayoutModel.findByPk.calledOnceWith('1', { include: layoutRepository._layoutInfoToInclude }));
    });

    test('should find a layout by name', async () => {
      const mockLayout = { id: '1', name: 'Unique Layout' };
      mockLayoutModel.findOne.resolves(mockLayout);

      const result = await layoutRepository.findLayoutByName('Unique Layout');

      deepStrictEqual(result, mockLayout);
      ok(mockLayoutModel.findOne.calledOnceWith({
        where: { name: 'Unique Layout' },
        include: layoutRepository._layoutInfoToInclude,
      }));
    });

    test('should find all layouts', async () => {
      const mockLayouts = [
        { id: '1', name: 'Layout 1' },
        { id: '2', name: 'Layout 2' },
      ];
      mockLayoutModel.findAll.resolves(mockLayouts);

      const result = await layoutRepository.findAllLayouts();

      deepStrictEqual(result, mockLayouts);
      ok(mockLayoutModel.findAll.calledOnceWith({ include: layoutRepository._layoutInfoToInclude }));
    });

    test('should find layouts by filters', async () => {
      //mock _getLayoutIdsByObjectPath
      sinon.stub(layoutRepository, '_getLayoutIdsByObjectPath').resolves(['1', '2']);
      const mockLayouts = [
        { id: '1', name: 'Filtered Layout 1' },
        { id: '2', name: 'Filtered Layout 2' },
      ];
      const filters = { objectPath: 'ITS/MC/RT' };
      mockLayoutModel.findAll.resolves(mockLayouts);

      const result = await layoutRepository.findLayoutsByFilters(filters);

      deepStrictEqual(result, mockLayouts);
      ok(layoutRepository._getLayoutIdsByObjectPath.calledOnceWith('ITS/MC/RT'));
      ok(mockLayoutModel.findAll.calledOnce, 'Expected findAll to be called once');
      const [callArgs] = mockLayoutModel.findAll.getCall(0).args;
      ok(callArgs.include, 'Expected include to be defined');
      strictEqual(callArgs.where.id[Op.in].length, 2, 'Expected where clause to filter by two IDs');
    });

    test('should find layout by name', async () => {
      const mockLayout = { id: '1', name: 'Unique Layout' };
      mockLayoutModel.findOne.resolves(mockLayout);

      const result = await layoutRepository.findLayoutByName('Unique Layout');

      deepStrictEqual(result, mockLayout);
      ok(mockLayoutModel.findOne.calledOnceWith({
        where: { name: 'Unique Layout' },
        include: layoutRepository._layoutInfoToInclude,
      }));
    });

    test('should create a new layout', async () => {
      const newLayout = { name: 'New Layout' };
      const createdLayout = { id: '2', ...newLayout };
      mockLayoutModel.create.resolves(createdLayout);

      const result = await layoutRepository.createLayout(newLayout);
      deepStrictEqual(result, createdLayout);
      ok(mockLayoutModel.create.calledOnceWith(newLayout, {}));
    });

    test('should update a layout', async () => {
      const layoutId = '1';
      const updateData = { name: 'Updated Layout' };
      const [updateCount] = [1];
      mockLayoutModel.update.resolves([updateCount]);

      const result = await layoutRepository.updateLayout(layoutId, updateData);
      strictEqual(result, updateCount);
      ok(mockLayoutModel.update.calledOnceWith(updateData, { where: { id: layoutId } }));
    });

    test('should delete a layout', async () => {
      const layoutId = '1';
      const deleteCount = 1;
      mockLayoutModel.destroy.resolves(deleteCount);

      const result = await layoutRepository.deleteLayout(layoutId);
      strictEqual(result, deleteCount);
      ok(mockLayoutModel.destroy.calledOnceWith({ where: { id: layoutId } }));
    });
  });
};
