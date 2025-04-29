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
import { deepEqual, deepStrictEqual, equal, ok, rejects, strictEqual, throws } from 'node:assert';
import { NotFoundError } from '@aliceo2/web-ui';
import sinon from 'sinon';
import { initTest } from '../../setup/testRepositorySetup.js';

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

    beforeEach(() => {
      jsonFileServiceMock.writeToFile.resetHistory();
    });

    test('should initialize LayoutRepository successfully', () => {
      ok(layoutRepository);
    });

    suite('list layouts', () => {
      test('should throw TypeError when fields is not an array', () => {
        throws(
          () => layoutRepository.listLayouts({ fields: 'not an array' }),
          {
            name: 'TypeError',
            message: 'fields parameter must be an array',
          },
          'Should throw TypeError when fields is not an array',
        );
      });

      test('should throw Error when specified field does not exist', () => {
        const nonExistentField = 'nonexistent_field';
        throws(
          () => layoutRepository.listLayouts({ fields: [nonExistentField] }),
          {
            name: 'Error',
            message: `The following field does not exist for layouts: ${nonExistentField}`,
          },
          'Should throw Error when field does not exist',
        );
      });

      test('should list all layouts without filter', async () => {
        const result = layoutRepository.listLayouts();
        equal(result.length, 2, 'Length of list of layouts is not correct');
        deepStrictEqual(result, jsonFileServiceMock.data.layouts, 'List of layouts filtered do not match the filters');
      });

      test('should filter layouts by owner_id', () => {
        const ownerId = 0;
        const result = layoutRepository.listLayouts({ owner_id: ownerId });

        equal(result.length, 2);
        result.forEach((layout) => {
          strictEqual(layout.owner_id, ownerId, `Layout owner_id should be ${ownerId}`);
        });

        deepStrictEqual(
          result[0],
          jsonFileServiceMock.data.layouts[0],
          'First layout should match the expected layout',
        );
      });

      test('should return empty array when no layouts match filters', () => {
        const result = layoutRepository.listLayoutCards({
          owner_id: 999,
          name: 'Non-existent Layout',
        });

        equal(result.length, 0);
      });

      test('should return only specified fields when fields array is provided', () => {
        const fields = ['id', 'name'];
        const result = layoutRepository.listLayouts({ fields });

        result.forEach((layout) => {
          const actualKeys = Object.keys(layout);
          deepStrictEqual(actualKeys.sort(), fields);
        });

        equal(result.length, jsonFileServiceMock.data.layouts.length);
      });
    });

    suite('list layoutCards', () => {
      const mockCards = (layout) =>({
        id: layout.id,
        name: layout.name,
        owner_id: layout.owner_id,
        owner_name: layout.owner_name,
        description: layout.description,
        isOfficial: layout.isOfficial,
      });

      test('should list all layouts without filter', async () => {
        const result = layoutRepository.listLayoutCards({});
        equal(result.length, 2, 'Length of list of layouts is not correct');
        deepStrictEqual(
          result,
          jsonFileServiceMock.data.layouts.map((layout) => mockCards(layout)),
          'List of layouts filtered do not match the filters',
        );
      });

      test('should filter layouts by owner_id', () => {
        const ownerId = 0;
        const result = layoutRepository.listLayoutCards({ owner_id: ownerId });

        equal(result.length, 2);
        result.forEach((layout) => {
          strictEqual(layout.owner_id, ownerId, `Layout owner_id should be ${ownerId}`);
        });

        deepStrictEqual(
          result[0],
          mockCards(jsonFileServiceMock.data.layouts[0]),
          'First layout should match the expected layout',
        );
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
        const expectedLayout = jsonFileServiceMock.data.layouts.find((l) => l.id === layoutId);
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

        equal(jsonFileServiceMock.data.layouts.length, 3);
        deepEqual(jsonFileServiceMock.data.layouts[2], newLayout);
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });

    suite('update layouts', () => {
      test('should update a single layout by its id', async () => {
        const newLayout = {
          id: '671b8c22402408122e2f20dd',
          name: 'Test Layout Updated',
          owner_id: 'user1',
          tabs: [{ name: 'Tab1', objects: [{ id: '1', name: 'Object1' }] }],
        };
        const idOfLayoutUpdated = await layoutRepository.updateLayout('671b8c22402408122e2f20dd', newLayout);
        equal(idOfLayoutUpdated, '671b8c22402408122e2f20dd');

        const updatedLayout = jsonFileServiceMock.data.layouts.find((l) => l.id === newLayout.id);
        strictEqual(updatedLayout.id, newLayout.id);
        strictEqual(updatedLayout.name, newLayout.name);
        strictEqual(updatedLayout.owner_id, newLayout.owner_id);
        deepStrictEqual(updatedLayout.tabs, newLayout.tabs);

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
          strictEqual(jsonFileServiceMock.data.layouts.length, 3);
          sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
        });
      });

      test('should delete an existing layout', async () => {
        const layoutIdToDelete = '3';
        const deletedLayoutId = await layoutRepository.deleteLayout(layoutIdToDelete);

        strictEqual(deletedLayoutId, layoutIdToDelete);
        strictEqual(jsonFileServiceMock.data.layouts.length, 2);
        strictEqual(deletedLayoutId, layoutIdToDelete);
        sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
      });
    });
  });
};
