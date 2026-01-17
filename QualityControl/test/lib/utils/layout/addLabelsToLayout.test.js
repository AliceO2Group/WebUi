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
import { addLabelsToLayout } from '../../../../lib/utils/layout/addLabelsToLayout.js';

export const addLabelsToLayoutTestSuite = () => {
  suite('\'addLabelsToLayout\' test suite', () => {
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

      const result = addLabelsToLayout(layout);

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

      const result = addLabelsToLayout(layout);

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

      const result = addLabelsToLayout(layout);

      deepStrictEqual(result.labels, ['qc'], 'Should include "qc" label from Tab2');
    });

    test('should return empty labels array when layout has no tabs', () => {
      const layout = {
        id: '5',
        name: 'No Tabs Layout',
      };

      const result = addLabelsToLayout(layout);

      ok(Array.isArray(result.labels), 'Labels should be an array');
      strictEqual(result.labels.length, 0, 'Should have empty labels array');
    });

    test('should return empty labels array when tabs have no objects', () => {
      const layout = {
        id: '6',
        name: 'Empty Tabs Layout',
        tabs: [{ name: 'Tab1' }],
      };

      const result = addLabelsToLayout(layout);

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

      const result = addLabelsToLayout(layout);

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

      const result = addLabelsToLayout(layout);

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

      const result = addLabelsToLayout(layout);

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
      const result = addLabelsToLayout(layout);

      ok(!('labels' in layout), 'Original layout should not have labels property added');
      strictEqual(layout.tabs, originalTabsReference, 'Original layout tabs should not be mutated');
      ok(result.labels, 'Result should have labels property');
    });
  });
};
