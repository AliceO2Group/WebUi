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
import { deepEqual, deepStrictEqual, ok, rejects, strictEqual, throws } from 'node:assert';
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

        strictEqual(jsonFileServiceMock.data.layouts.length, 4);
        deepEqual(jsonFileServiceMock.data.layouts[3], newLayout);
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
        strictEqual(idOfLayoutUpdated, '671b8c22402408122e2f20dd');

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

    suite('\'_addLabelsToLayout\' test suite', () => {
      test('should extract unique labels from multiple objects with different prefixes', () => {
        const layout = {
          id: '2',
          name: 'Multi Prefix Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'qc/MCH/QO/Check1' },
                { id: 'obj2', name: 'qc_async/System/Monitor' },
                { id: 'obj3', name: 'qc_mc/Processing/Status' },
              ],
            },
          ],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        deepStrictEqual(result.labels, ['qc', 'qc_async', 'qc_mc'], 'Should contain all 3 labels');
      });

      test('should handle duplicate prefixes and return unique labels only', () => {
        const layout = {
          id: '3',
          name: 'Duplicate Prefix Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'qc/MCH/QO/Check1' },
                { id: 'obj2', name: 'qc/TPC/QO/Check2' },
                { id: 'obj3', name: 'qc/ITS/QO/Check3' },
              ],
            },
          ],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        deepStrictEqual(result.labels, ['qc'], 'Should extract "qc" as the only label');
      });

      test('should handle multiple tabs with objects', () => {
        const layout = {
          id: '4',
          name: 'Multi Tab Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1', name: 'qc/MCH/QO/Check1' }],
            },
            {
              name: 'Tab2',
              objects: [{ id: 'obj2', name: 'qc/System/Monitor' }],
            },
          ],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        deepStrictEqual(result.labels, ['qc'], 'Should include "qc" label from Tab2');
      });

      test('should return empty labels array when layout has no tabs', () => {
        const layout = {
          id: '5',
          name: 'No Tabs Layout',
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        ok(Array.isArray(result.labels), 'Labels should be an array');
        strictEqual(result.labels.length, 0, 'Should have empty labels array');
      });

      test('should return empty labels array when tabs have no objects', () => {
        const layout = {
          id: '6',
          name: 'Empty Tabs Layout',
          tabs: [{ name: 'Tab1' }],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        ok(Array.isArray(result.labels), 'Labels should be an array');
        strictEqual(result.labels.length, 0, 'Should have empty labels array');
      });

      test('should return empty labels array when objects have no names', () => {
        const layout = {
          id: '7',
          name: 'No Names Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1' }, { id: 'obj2' }],
            },
          ],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        ok(Array.isArray(result.labels), 'Labels should be an array');
        strictEqual(result.labels.length, 0, 'Should have empty labels array when objects have no names');
      });

      test('should handle objects with names that do not contain slashes', () => {
        const layout = {
          id: '8',
          name: 'No Slash Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'simpleObject' },
                { id: 'obj2', name: 'anotherSimpleObject' },
              ],
            },
          ],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        strictEqual(result.labels.length, 2, 'Should extract full names as labels');
        ok(result.labels.includes('simpleObject'), 'Should include "simpleObject" as label');
        ok(result.labels.includes('anotherSimpleObject'), 'Should include "anotherSimpleObject" as label');
      });

      test('should handle mixed objects with and without names', () => {
        const layout = {
          id: '9',
          name: 'Mixed Objects Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'qc/MCH/QO/Check1' },
                { id: 'obj2' },
                { id: 'obj3', name: 'qc/System/Monitor' },
              ],
            },
          ],
        };

        const result = layoutRepository._addLabelsToLayout(layout);

        deepStrictEqual(result.labels, ['qc'], 'Should include "qc" label');
      });

      test('should not mutate the original layout object', () => {
        const layout = {
          id: '10',
          name: 'Original Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1', name: 'qc/MCH/QO/Check1' }],
            },
          ],
        };

        const originalTabsReference = layout.tabs;
        const result = layoutRepository._addLabelsToLayout(layout);

        ok(!('labels' in layout), 'Original layout should not have labels property added');
        strictEqual(layout.tabs, originalTabsReference, 'Original layout tabs should not be mutated');
        ok(result.labels, 'Result should have labels property');
      });
    });

    suite('\'_trimAndLabelLayout\' test suite', () => {
      test('should return labeled layout with all fields when fields array is empty', () => {
        const layout = {
          id: '1',
          name: 'Test Layout',
          owner_id: 'user1',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'qc/MCH/QO/Check1' },
                { id: 'obj2', name: 'daq/System/Monitor' },
              ],
            },
          ],
        };

        const result = layoutRepository._trimAndLabelLayout(layout, []);

        ok(result.labels, 'Should have labels field');
        strictEqual(result.id, layout.id, 'Should have id field');
        strictEqual(result.name, layout.name, 'Should have name field');
        strictEqual(result.owner_id, layout.owner_id, 'Should have owner_id field');
        deepStrictEqual(result.tabs, layout.tabs, 'Should have tabs field');
        strictEqual(result.labels.length, 2, 'Should have 2 labels');
        ok(result.labels.includes('qc'), 'Should include "qc" label');
        ok(result.labels.includes('daq'), 'Should include "daq" label');
      });

      test('should return only specified fields when fields array is provided', () => {
        const layout = {
          id: '2',
          name: 'Test Layout',
          owner_id: 'user2',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1', name: 'qc/MCH/QO/Check1' }],
            },
          ],
        };
        const fields = ['id', 'name'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        const resultKeys = Object.keys(result);
        strictEqual(resultKeys.length, 2, 'Should have exactly 2 fields');
        deepStrictEqual(resultKeys.sort(), fields.sort(), 'Should have only specified fields');
        strictEqual(result.id, layout.id, 'Should have correct id value');
        strictEqual(result.name, layout.name, 'Should have correct name value');
        ok(!result.owner_id, 'Should not have owner_id field');
        ok(!result.tabs, 'Should not have tabs field');
        ok(!result.labels, 'Should not have labels field when not requested');
      });

      test('should include labels field when explicitly requested in fields array', () => {
        const layout = {
          id: '3',
          name: 'Test Layout',
          owner_id: 'user3',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'qc/MCH/QO/Check1' },
                { id: 'obj2', name: 'daq/System/Monitor' },
              ],
            },
          ],
        };
        const fields = ['id', 'name', 'labels'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        const resultKeys = Object.keys(result);
        strictEqual(resultKeys.length, 3, 'Should have exactly 3 fields');
        ok(result.labels, 'Should have labels field');
        ok(Array.isArray(result.labels), 'Labels should be an array');
        strictEqual(result.labels.length, 2, 'Should have 2 labels');
        ok(result.labels.includes('qc'), 'Should include "qc" label');
        ok(result.labels.includes('daq'), 'Should include "daq" label');
        strictEqual(result.id, layout.id, 'Should have correct id value');
        strictEqual(result.name, layout.name, 'Should have correct name value');
      });

      test('should handle fields array with non-existent field names', () => {
        const layout = {
          id: '4',
          name: 'Test Layout',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1', name: 'qc/MCH/QO/Check1' }],
            },
          ],
        };
        const fields = ['id', 'name', 'nonExistentField', 'anotherNonExistent'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        const resultKeys = Object.keys(result);
        strictEqual(resultKeys.length, 2, 'Should only include existing fields');
        ok(result.id, 'Should have id field');
        ok(result.name, 'Should have name field');
        ok(!result.nonExistentField, 'Should not have nonExistentField');
        ok(!result.anotherNonExistent, 'Should not have anotherNonExistent');
      });

      test('should handle layout with no tabs', () => {
        const layout = {
          id: '5',
          name: 'No Tabs Layout',
          owner_id: 'user5',
        };
        const fields = ['id', 'name', 'labels'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        strictEqual(result.id, layout.id, 'Should have id field');
        strictEqual(result.name, layout.name, 'Should have name field');
        ok(Array.isArray(result.labels), 'Should have labels field as array');
        strictEqual(result.labels.length, 0, 'Should have empty labels array');
      });

      test('should handle layout with tabs but no objects', () => {
        const layout = {
          id: '6',
          name: 'Empty Tabs Layout',
          owner_id: 'user6',
          tabs: [{ name: 'Tab1' }],
        };
        const fields = ['id', 'labels'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        strictEqual(result.id, layout.id, 'Should have id field');
        ok(Array.isArray(result.labels), 'Should have labels field as array');
        strictEqual(result.labels.length, 0, 'Should have empty labels array');
        ok(!result.name, 'Should not have name field');
        ok(!result.tabs, 'Should not have tabs field');
      });

      test('should not mutate the original layout object', () => {
        const layout = {
          id: '7',
          name: 'Original Layout',
          owner_id: 'user7',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1', name: 'qc/MCH/QO/Check1' }],
            },
          ],
        };
        const fields = ['id', 'name', 'labels'];
        const originalTabsReference = layout.tabs;

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        ok(!('labels' in layout), 'Original layout should not have labels property added');
        strictEqual(layout.tabs, originalTabsReference, 'Original layout tabs should not be mutated');
        strictEqual(layout.owner_id, 'user7', 'Original layout owner_id should be unchanged');
        ok(result.labels, 'Result should have labels property');
        strictEqual(Object.keys(result).length, 3, 'Result should have only requested fields');
      });

      test('should correctly trim complex layout with multiple tabs and objects', () => {
        const layout = {
          id: '8',
          name: 'Complex Layout',
          owner_id: 'user8',
          createdAt: '2026-01-17',
          updatedAt: '2026-01-17',
          tabs: [
            {
              name: 'Tab1',
              objects: [
                { id: 'obj1', name: 'qc/MCH/QO/Check1' },
                { id: 'obj2', name: 'qc/TPC/QO/Check2' },
              ],
            },
            {
              name: 'Tab2',
              objects: [{ id: 'obj3', name: 'daq/System/Monitor' }],
            },
          ],
        };
        const fields = ['id', 'name', 'labels', 'owner_id'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        strictEqual(Object.keys(result).length, 4, 'Should have exactly 4 fields');
        strictEqual(result.id, layout.id);
        strictEqual(result.name, layout.name);
        strictEqual(result.owner_id, layout.owner_id);
        ok(Array.isArray(result.labels), 'Labels should be an array');
        strictEqual(result.labels.length, 2, 'Should have 2 unique labels');
        ok(result.labels.includes('qc'), 'Should include "qc" label');
        ok(result.labels.includes('daq'), 'Should include "daq" label');
        ok(!result.tabs, 'Should not include tabs field');
        ok(!result.createdAt, 'Should not include createdAt field');
        ok(!result.updatedAt, 'Should not include updatedAt field');
      });

      test('should handle single field selection', () => {
        const layout = {
          id: '9',
          name: 'Single Field Layout',
          owner_id: 'user9',
          tabs: [
            {
              name: 'Tab1',
              objects: [{ id: 'obj1', name: 'qc/MCH/QO/Check1' }],
            },
          ],
        };
        const fields = ['name'];

        const result = layoutRepository._trimAndLabelLayout(layout, fields);

        strictEqual(Object.keys(result).length, 1, 'Should have exactly 1 field');
        strictEqual(result.name, layout.name, 'Should have correct name value');
        ok(!result.id, 'Should not have id field');
        ok(!result.owner_id, 'Should not have owner_id field');
        ok(!result.labels, 'Should not have labels field');
        ok(!result.tabs, 'Should not have tabs field');
      });
    });
  });
};
