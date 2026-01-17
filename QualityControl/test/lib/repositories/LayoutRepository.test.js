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
import { deepEqual, deepStrictEqual, ok, rejects, strictEqual, throws } from 'node:assert';
import { NotFoundError } from '@aliceo2/web-ui';
import sinon from 'sinon';
import { initTest } from '../../setup/testRepositorySetup.js';
import { LayoutRepository } from '../../../lib/repositories/LayoutRepository.js';
import { addLabelsToLayout } from '../../../lib/utils/layout/addLabelsToLayout.js';

/**
 * @typedef {import('../../../lib/services/JsonFileService.js').JsonFileService} JsonFileService
 */

export const layoutRepositoryTest = async () => {
  suite('Layout repository tests', () => {
    let jsonFileServiceMock = null;
    let layoutRepository = null;

    before(async () => {
      const { mockedJsonFileService } = await initTest();
      jsonFileServiceMock = mockedJsonFileService;
      layoutRepository = new LayoutRepository(jsonFileServiceMock);
    });

    beforeEach(() => {
      jsonFileServiceMock.writeToFile.resetHistory();
    });

    test('should initialize LayoutRepository successfully', () => {
      ok(layoutRepository);
    });

    suite('list layouts', () => {
      test('should list all layouts without filter', () => {
        const result = layoutRepository.listLayouts();
        strictEqual(result.length, 3, 'Length of list of layouts is not correct');
        result.forEach((layout) => {
          ok(layout.labels, 'Each layout should have labels field');
          delete layout.labels; // remove labels for deep comparison
        });
        deepStrictEqual(result, jsonFileServiceMock.data.layouts, 'List of layouts filtered do not match the filters');
      });

      test('should filter layouts by owner_id', () => {
        const ownerId = 0;
        const result = layoutRepository.listLayouts({ filter: { owner_id: ownerId } });

        strictEqual(result.length, 2, 'number of layouts is incorrect');
        result.forEach((layout, index) => {
          delete layout.labels; // remove labels for deep comparison
          strictEqual(layout.owner_id, ownerId, `Layout owner_id should be ${ownerId}`);
          deepStrictEqual(
            layout,
            jsonFileServiceMock.data.layouts[index],
            'Filtered layout does not match expected layout',
          );
        });
      });

      test('should return only layout with specified filter.objectPath', () => {
        const objectPath = 'qc/MCH/QO/DataDecodingCheck';
        const result = layoutRepository.listLayouts({ filter: {
          objectPath,
        } });
        strictEqual(result.length, 1, "listLayouts's filter.objectPath should only return one layout");
      });

      test('should return layouts with specified partial filter.objectPath', () => {
        const objectPath = '/1';
        const result = layoutRepository.listLayouts({ filter: {
          objectPath,
        } });
        strictEqual(result.length, 2, "listLayouts's filter.objectPath should only return 2 layouts");
      });

      test('should return all layouts when filter.objectPath is empty string', () => {
        const objectPath = '';
        const result = layoutRepository.listLayouts({ filter: {
          objectPath,
        } });
        strictEqual(result.length, 3, "listLayouts's filter.objectPath should only return 3 (all) layouts");
      });

      test('should return all layouts when filter is an empty object', () => {
        const result = layoutRepository.listLayouts({ filter: {} });
        strictEqual(result.length, 3, "listLayouts's empty filter object should only return 3 (all) layouts");
      });

      test('should return only specified fields when fields array is provided', () => {
        const fields = ['id', 'name'];
        const result = layoutRepository.listLayouts({ fields });

        result.forEach((layout) => {
          const actualKeys = Object.keys(layout);
          strictEqual(actualKeys.length, 2, 'Should have exactly 2 fields');
          deepStrictEqual(actualKeys.sort(), fields.sort());
        });

        strictEqual(result.length, jsonFileServiceMock.data.layouts.length);
      });

      test('should include labels field when requested in fields array', () => {
        const fields = ['id', 'name', 'labels'];
        const result = layoutRepository.listLayouts({ fields });

        result.forEach((layout) => {
          const actualKeys = Object.keys(layout);
          strictEqual(actualKeys.length, 3, 'Should have exactly 3 fields');
          ok(layout.labels, 'Should have labels field');
          ok(Array.isArray(layout.labels), 'Labels should be an array');
        });

        strictEqual(result.length, jsonFileServiceMock.data.layouts.length);
      });
    });

    suite('read layouts', () => {
      test('readLayoutById should throw NotFoundError when layout is not found', () => {
        throws(() => {
          layoutRepository.readLayoutById('999');
        }, NotFoundError);
      });

      test('should return a layout if it is found', () => {
        const layoutId = '671b95883d23cd0d67bdc787';
        const layout = layoutRepository.readLayoutById(layoutId);
        const expectedLayout = addLabelsToLayout(jsonFileServiceMock.data.layouts.find((l) => l.id === layoutId));
        strictEqual(layout.id, layoutId);
        deepStrictEqual(layout, expectedLayout);
        strictEqual(layout.name, expectedLayout.name);
        strictEqual(layout.owner_id, expectedLayout.owner_id);
      });
    });

    suite('create layouts', () => {
      test('should throw an error if id is not provided', () => {
        const newLayout = { name: 'New Layout', owner_id: 'user3' };
        return rejects(
          layoutRepository.createLayout(newLayout),
          (err) => err instanceof Error && err.message === 'layout id is mandatory',
        ).then(() => {
          sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        });
      });

      test('should throw an error if name is not provided', () => {
        const newLayout = { id: '3', owner_id: 'user3' };
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        return rejects(
          layoutRepository.createLayout(newLayout),
          (err) => err instanceof Error && err.message === 'layout name is mandatory',
        );
      });

      test('should throw an error if id already exists', async () => {
        const newLayout = { id: '671b8c22402408122e2f20dd', name: 'New Layout', owner_id: 'user3' };
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        await rejects(
          layoutRepository.createLayout(newLayout),
          (err) => err instanceof Error
            && err.message === 'layout with this id (671b8c22402408122e2f20dd) already exists',
        );
      });

      test('should create a new layout successfully', async () => {
        const newLayout = { id: '3', name: 'New Layout', owner_id: 'user3' };
        await layoutRepository.createLayout(newLayout);

        strictEqual(jsonFileServiceMock.data.layouts.length, 4);
        deepEqual(jsonFileServiceMock.data.layouts[3], newLayout);
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });

    suite('update layouts', () => {
      test('should update a single layout by its id', async () => {
        const idOfLayoutToUpdate = '671b8c22402408122e2f20dd';
        const newLayout = {
          id: idOfLayoutToUpdate,
          name: 'Test Layout Updated',
          owner_id: 'user1',
          tabs: [{ name: 'Tab1', objects: [{ id: '1', name: 'Object1' }] }],
        };
        const idOfLayoutUpdated = await layoutRepository.updateLayout(idOfLayoutToUpdate, newLayout);
        strictEqual(idOfLayoutUpdated, idOfLayoutToUpdate);

        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });

    suite('delete layouts', () => {
      test('should throw an error if the layoutId does not exist', async () => {
        const nonExistentLayoutId = 'nonExistentId';
        return rejects(
          layoutRepository.deleteLayout(nonExistentLayoutId),
          (err) => err instanceof Error && err.message === `layout (${nonExistentLayoutId}) not found`,
        ).then(() => {
          strictEqual(jsonFileServiceMock.data.layouts.length, 4);
          sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        });
      });

      test('should delete an existing layout', async () => {
        const layoutIdToDelete = '3';
        const deletedLayoutId = await layoutRepository.deleteLayout(layoutIdToDelete);

        strictEqual(deletedLayoutId, layoutIdToDelete);
        strictEqual(jsonFileServiceMock.data.layouts.length, 3);
        strictEqual(deletedLayoutId, layoutIdToDelete);
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });
  });
};
