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

import { suite, test } from 'node:test';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { trimLayoutPerRequiredFields } from '../../../../lib/utils/layout/trimLayoutPerRequiredFields.js';

export const trimLayoutPerRequiredFieldsTestSuite = () => {
  suite('\'trimLayoutPerRequiredFields\' test suite', () => {
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

      const result = trimLayoutPerRequiredFields(layout, []);

      strictEqual(result.id, layout.id, 'Should have id field');
      strictEqual(result.name, layout.name, 'Should have name field');
      strictEqual(result.owner_id, layout.owner_id, 'Should have owner_id field');
      deepStrictEqual(result.tabs, layout.tabs, 'Should have tabs field');
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

      const result = trimLayoutPerRequiredFields(layout, fields);

      const resultKeys = Object.keys(result);
      strictEqual(resultKeys.length, 2, 'Should have exactly 2 fields');
      deepStrictEqual(resultKeys.sort(), fields.sort(), 'Should have only specified fields');
      strictEqual(result.id, layout.id, 'Should have correct id value');
      strictEqual(result.name, layout.name, 'Should have correct name value');
      ok(!result.owner_id, 'Should not have owner_id field');
      ok(!result.tabs, 'Should not have tabs field');
    });

    test('should not include labels field when explicitly requested if not in layout', () => {
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
      const result = trimLayoutPerRequiredFields(layout, fields);

      const resultKeys = Object.keys(result);
      strictEqual(resultKeys.length, 2, 'Should have exactly 3 fields');
      ok(!result.labels, 'Should have labels field');
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

      const result = trimLayoutPerRequiredFields(layout, fields);

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
      const fields = ['id', 'name'];

      const result = trimLayoutPerRequiredFields(layout, fields);

      strictEqual(result.id, layout.id, 'Should have id field');
      strictEqual(result.name, layout.name, 'Should have name field');
    });

    test('should handle layout with tabs but no objects', () => {
      const layout = {
        id: '6',
        name: 'Empty Tabs Layout',
        owner_id: 'user6',
        tabs: [{ name: 'Tab1' }],
      };
      const fields = ['id'];

      const result = trimLayoutPerRequiredFields(layout, fields);

      strictEqual(result.id, layout.id, 'Should have id field');
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
      const fields = ['id', 'name'];
      const originalTabsReference = layout.tabs;

      const result = trimLayoutPerRequiredFields(layout, fields);

      strictEqual(layout.tabs, originalTabsReference, 'Original layout tabs should not be mutated');
      strictEqual(layout.owner_id, 'user7', 'Original layout owner_id should be unchanged');
      strictEqual(Object.keys(result).length, 2, 'Result should have only requested fields');
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
      const fields = ['id', 'name', 'owner_id'];

      const result = trimLayoutPerRequiredFields(layout, fields);

      strictEqual(Object.keys(result).length, 3, 'Should have exactly 3 fields');
      strictEqual(result.id, layout.id);
      strictEqual(result.name, layout.name);
      strictEqual(result.owner_id, layout.owner_id);
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

      const result = trimLayoutPerRequiredFields(layout, fields);

      strictEqual(Object.keys(result).length, 1, 'Should have exactly 1 field');
      strictEqual(result.name, layout.name, 'Should have correct name value');
      ok(!result.id, 'Should not have id field');
      ok(!result.owner_id, 'Should not have owner_id field');
      ok(!result.labels, 'Should not have labels field');
      ok(!result.tabs, 'Should not have tabs field');
    });
  });
};
