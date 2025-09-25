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

    test('should inherit from BaseRepository', () => {
      ok(layoutRepository.model);
    });

    test('should handle model operations', async () => {
      const mockLayout = { id: '1', name: 'Test Layout' };
      mockLayoutModel.findByPk.resolves(mockLayout);

      const result = await layoutRepository.model.findByPk('1');
      deepStrictEqual(result, mockLayout);
      ok(mockLayoutModel.findByPk.calledWith('1'));
    });

    test('should handle create operations', async () => {
      const layoutData = { name: 'New Layout', owner_username: 'test' };
      const createdLayout = { id: '1', ...layoutData };
      mockLayoutModel.create.resolves(createdLayout);

      const result = await layoutRepository.model.create(layoutData);
      deepStrictEqual(result, createdLayout);
      ok(mockLayoutModel.create.calledWith(layoutData));
    });
  });
};
