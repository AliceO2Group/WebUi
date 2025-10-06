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
import { stub } from 'sinon';
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
        findAll: stub(),
        findByPk: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
        findOne: stub(),
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

    test('should filter layout by objectPath', async () => {
      const mockLayouts = [
        {
          id: '1',
          name: 'Layout 1',
          tabs: [
            { objects: [{ name: 'ObjectA' }, { name: 'ObjectB' }] },
            { objects: [{ name: 'ObjectC' }] },
          ],
        },
        {
          id: '2',
          name: 'Layout 2',
          tabs: [{ objects: [{ name: 'ObjectD' }] }],
        },
      ];

      stub(layoutRepository, '_getLayoutIdsByObjectPath').resolves(['1']);

      layoutRepository.model.findAll = stub().resolves([mockLayouts[0]]);

      const result = await layoutRepository.findLayoutsByFilters({ objectPath: 'objectb' });

      deepStrictEqual(result, [mockLayouts[0]], 'Should return only layouts containing ObjectB');

      ok(layoutRepository.model.findAll.calledOnceWithMatch({
        where: { id: { [Op.in]: ['1'] } },
        include: layoutRepository._layoutInfoToInclude,
      }));

      layoutRepository._getLayoutIdsByObjectPath.restore();
    });

    test('should return empty array if no layouts match objectPath filter', async () => {
      stub(layoutRepository, '_getLayoutIdsByObjectPath').resolves([]);
      const result = await layoutRepository.findLayoutsByFilters({ objectPath: 'nonexistent' });

      deepStrictEqual(result, [], 'Should return empty array when no layouts match');
      ok(layoutRepository.model.findAll.notCalled, 'findAll should not be called when no IDs are found');
      layoutRepository._getLayoutIdsByObjectPath.restore();
    });

    test('should return all layouts when no filters are applied', async () => {
      const mockLayouts = [
        { id: '1', name: 'Layout 1' },
        { id: '2', name: 'Layout 2' },
      ];
      mockLayoutModel.findAll.resolves(mockLayouts);
      const result = await layoutRepository.findLayoutsByFilters({});
      deepStrictEqual(result, mockLayouts);
      ok(mockLayoutModel.findAll.calledOnceWithMatch({
        where: {},
        include: layoutRepository._layoutInfoToInclude,
      }));
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
      const updateCount = 1;
      mockLayoutModel.update.resolves(updateCount);

      const affectedCount = await layoutRepository.updateLayout(layoutId, updateData);
      strictEqual(affectedCount, updateCount);
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
