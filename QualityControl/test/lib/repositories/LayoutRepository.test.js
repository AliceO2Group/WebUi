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

import { suite, test, before, beforeEach } from 'node:test';
import { LayoutRepository } from '../../../lib/repositories/LayoutRepository.js';
import assert, { deepEqual, deepStrictEqual, equal, strictEqual } from 'node:assert';
import { NotFoundError } from '@aliceo2/web-ui';
import sinon from 'sinon';

/**
 * @typedef {import('../../../lib/services/JsonFileService.js').JsonFileService} JsonFileService
 */

export const layoutRepositoryTest = async () => {
  suite('Layout repository tests', () => {
    /**
     * @type {JsonFileService}
     */
    let jsonFileServiceMock = null;

    /**
     * @type {LayoutRepository}
     */
    let layoutRepository = null;

    const mockedLayouts = [
      { id: '1', name: 'Test Layout', owner_id: 'user1' },
      { id: '2', name: 'Another Layout', owner_id: 'user2' },
    ];

    before(async () => {
      jsonFileServiceMock = {
        data: {
          layouts: mockedLayouts,
        },
        writeToFile: sinon.stub().resolves(),
      };
      layoutRepository = new LayoutRepository(jsonFileServiceMock);
    });

    beforeEach(() => {
      jsonFileServiceMock.writeToFile.resetHistory();
    });

    test('should initialize LayoutRepository successfully', () => {
      assert.ok(layoutRepository);
    });

    suite('list layouts', () => {
      test('should list all layouts without filter', async () => {
        const result = layoutRepository.listLayouts({});
        equal(result.length, 2, 'Length of list of layouts is not correct');
        deepStrictEqual(result, jsonFileServiceMock.data.layouts, 'List of layouts filtered do not match the filters');
      });

      test('should filter layouts by owner_id', () => {
        const result = layoutRepository.listLayouts({ owner_id: 'user1' });
        equal(result.length, 1);
        deepEqual(result[0], { id: '1', name: 'Test Layout', owner_id: 'user1' });
      });
    });

    suite('read layouts', () => {
      test('should throw error if layout is not found by id', () => {
        assert.throws(
          () => layoutRepository.readLayoutById('999'),
          new NotFoundError('layout (999) not found'),
        );
      });

      test('should return a layout if it is found', () => {
        const layout = layoutRepository.readLayoutById('2');
        deepEqual(layout, { id: '2', name: 'Another Layout', owner_id: 'user2' });
      });
    });

    suite('create layouts', () => {
      test('should throw an error if id is not provided', () => {
        const newLayout = { name: 'New Layout', owner_id: 'user3' };
        return assert.rejects(
          layoutRepository.createLayout(newLayout),
          (err) => err instanceof Error && err.message === 'layout id is mandatory',
        ).then(() => {
          sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        });
      });

      test('should throw an error if name is not provided', () => {
        const newLayout = { id: '3', owner_id: 'user3' };
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        return assert.rejects(
          layoutRepository.createLayout(newLayout),
          (err) => err instanceof Error && err.message === 'layout name is mandatory',
        );
      });

      test('should throw an error if id already exists', () => {
        const newLayout = { id: '2', name: 'New Layout', owner_id: 'user3' };
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        return assert.rejects(
          layoutRepository.createLayout(newLayout),
          (err) => err instanceof Error && err.message === 'layout with this id (2) already exists',
        );
      });

      test('should create a new layout successfully', async () => {
        const newLayout = { id: '3', name: 'New Layout', owner_id: 'user3' };
        await layoutRepository.createLayout(newLayout);

        assert.equal(jsonFileServiceMock.data.layouts.length, 3);
        assert.deepEqual(jsonFileServiceMock.data.layouts[2], newLayout);
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });

    suite('update layouts', () => {
      test('should update a single layout by its id', async () => {
        const newLayout = { id: '1', name: 'Test Layout Updated', owner_id: 'user1' };
        const idOfLayoutUpdated = await layoutRepository.updateLayout('1', newLayout);
        equal(idOfLayoutUpdated, '1');
        deepEqual(jsonFileServiceMock.data.layouts[0], { id: '1', name: 'Test Layout Updated', owner_id: 'user1' });
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });

    suite('delete layouts', () => {
      test('should throw an error if the layoutId does not exist', async () => {
        const nonExistentLayoutId = 'nonExistentId';

        await assert.rejects(
          layoutRepository.deleteLayout(nonExistentLayoutId),
          (err) => err instanceof Error &&
            err.message === `layout (${nonExistentLayoutId}) not found`,
        );

        strictEqual(jsonFileServiceMock.data.layouts.length, 3);
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      });

      test('should delete an existing layout', async () => {
        const layoutIdToDelete = '3';
        const deletedLayoutId = await layoutRepository.deleteLayout(layoutIdToDelete);

        assert.strictEqual(deletedLayoutId, layoutIdToDelete);
        assert.strictEqual(jsonFileServiceMock.data.layouts.length, 2);
        assert.deepStrictEqual(
          jsonFileServiceMock.data.layouts,
          mockedLayouts,
        );
        strictEqual(deletedLayoutId, layoutIdToDelete);
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });
  });
};
