/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { suite, test } from 'node:test';
import { ok, equal, deepStrictEqual } from 'node:assert';

import {
  isObjectOfTypeChecker,
  OBJECT_TYPE_KEY,
  generateDrawingOptionList,
  getObjectsNameFromConsulMap,
} from './../../../../common/library/qcObject/utils.js';
import { ONLINE_SERVICES } from './../../../demoData/online-services.mock.js';

/**
 * Test Suite for the common library of qcg - utils module
 * @returns {undefined}
 */
export const commonLibraryQcObjectUtilsTestSuite = () => {
  suite('isObjectOfTypeChecker - test suite', () => {
    test('should successfully return that object is checker when type matches', () => {
      const qcObject = {
        [OBJECT_TYPE_KEY]: 'some-qualityobject-to-render',
      };
      ok(isObjectOfTypeChecker(qcObject));
    });

    test('should successfully return that object is NOT a checker when type does not match', () => {
      const qcObject = {
        [OBJECT_TYPE_KEY]: 'TGraph',
      };
      equal(isObjectOfTypeChecker(qcObject), false);
    });

    test('should successfully return that object is NOT a checker when type is missing', () => {
      const qcObject = {
        [OBJECT_TYPE_KEY]: '',
      };
      equal(isObjectOfTypeChecker(qcObject), false);
      equal(isObjectOfTypeChecker({}), false);
    });
  });

  suite('generateDrawingOptionList - test suite', () => {
    test('should successfully remove duplicates from given list', () => {
      const drawingOptions = ['colz', 'colz', 'gridx'];
      deepStrictEqual(generateDrawingOptionList({}, drawingOptions), ['colz', 'gridx', 'nostat', 'f']);
    });

    test('should successfully add `f` option for non-graph types', () => {
      deepStrictEqual(generateDrawingOptionList({}, []), ['nostat', 'f']);
      deepStrictEqual(generateDrawingOptionList({ _typename: 'TFlex' }, []), ['nostat', 'f']);
    });

    test('should successfully NOT add `f` option for graph types', () => {
      deepStrictEqual(generateDrawingOptionList({ _typename: 'TGraph' }, ['colz']), ['colz', 'nostat']);
    });

    test('should successfully return single `nostat` if empty list is provided', () => {
      deepStrictEqual(generateDrawingOptionList({ _typename: 'TGraph' }, []), ['nostat']);
    });

    test('should successfully add `optstat=111` if `stat` is passed in options', () => {
      deepStrictEqual(
        generateDrawingOptionList({ _typename: 'TGraph' }, ['gridx', 'stat']),
        ['gridx', 'optstat=1111'],
      );
    });
  });

  suite('getObjectsNameFromConsulMap - test suite', () => {
    test('should successfully return a list of mapped tags prefix is provided', () => {
      const expectedTags = [
        { name: 'QcTask/example' },
        { name: 'QcTask/other' },
        { name: 'QcTask/p2' },
      ];
      deepStrictEqual(getObjectsNameFromConsulMap(ONLINE_SERVICES, 'Qc'), expectedTags);
    });

    test('should successfully return all tags when no prefix is provided', () => {
      const expectedTags = [
        { name: 'QcTask/example' },
        { name: 'ITSRAWDS/example' },
        { name: 'QcTask/other' },
        { name: 'TOF_RAWS/example' },
        { name: 'QcTask/p2' },
        { name: 'ABC/p2' },
      ];
      deepStrictEqual(getObjectsNameFromConsulMap(ONLINE_SERVICES), expectedTags);
    });

    test('should successfully return an empty list if tags are missing', () => {
      const services = {
        task: {},
        task2: { tag: [] },
        task3: undefined,
      };
      deepStrictEqual(getObjectsNameFromConsulMap(services), []);
    });
  });
};
