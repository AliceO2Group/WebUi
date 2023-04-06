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

import assert from 'assert';
import {
  isObjectOfTypeChecker,
  OBJECT_TYPE_KEY,
  generateDrawingOptionList,
  getTagsFromServices,
} from './../../../../common/library/qcObject/utils.js';
import { ONLINE_SERVICES } from './../../../demoData/online-services.mock.js';

/**
 * Test Suite for the common library of qcg - utils module
 * @returns {undefined}
 */
export const commonLibraryQcObjectUtilsTestSuite = async () => {
  describe('isObjectOfTypeChecker - test suite', () => {
    it('should successfully return that object is checker when type matches', () => {
      const qcObject = {
        [OBJECT_TYPE_KEY]: 'some-qualityobject-to-render',
      };
      assert.ok(isObjectOfTypeChecker(qcObject));
    });

    it('should successfully return that object is NOT a checker when type does not match', () => {
      const qcObject = {
        [OBJECT_TYPE_KEY]: 'TGraph',
      };
      assert.equal(isObjectOfTypeChecker(qcObject), false);
    });

    it('should successfully return that object is NOT a checker when type is missing', () => {
      const qcObject = {
        [OBJECT_TYPE_KEY]: '',
      };
      assert.equal(isObjectOfTypeChecker(qcObject), false);
      assert.equal(isObjectOfTypeChecker({}), false);
    });
  });

  describe('generateDrawingOptionList - test suite', () => {
    it('should successfully remove duplicates from given list', () => {
      const drawingOptions = ['colz', 'colz', 'gridx'];
      assert.deepStrictEqual(generateDrawingOptionList({}, drawingOptions), ['colz', 'gridx', 'nostat', 'f']);
    });

    it('should successfully add `f` option for non-graph types', () => {
      assert.deepStrictEqual(generateDrawingOptionList({}, []), ['nostat', 'f']);
      assert.deepStrictEqual(generateDrawingOptionList({ _typename: 'TFlex' }, []), ['nostat', 'f']);
    });

    it('should successfully NOT add `f` option for graph types', () => {
      assert.deepStrictEqual(generateDrawingOptionList({ _typename: 'TGraph' }, ['colz']), ['colz', 'nostat']);
    });

    it('should successfully return single `nostat` if empty list is provided', () => {
      assert.deepStrictEqual(generateDrawingOptionList({ _typename: 'TGraph' }, []), ['nostat']);
    });

    it('should successfully add `optstat=111` if `stat` is passed in options', () => {
      assert.deepStrictEqual(
        generateDrawingOptionList({ _typename: 'TGraph' }, ['gridx', 'stat']),
        ['gridx', 'optstat=1111'],
      );
    });
  });

  describe('getTagsFromServices - test suite', () => {
    it('should successfully return a list of mapped tags prefix is provided', () => {
      const expectedTags = [
        { name: 'QcTask/example' },
        { name: 'QcTask/other' },
        { name: 'QcTask/p2' },
      ];
      assert.deepStrictEqual(getTagsFromServices(ONLINE_SERVICES, 'Qc'), expectedTags);
    });

    it('should successfully return all tags when no prefix is provided', () => {
      const expectedTags = [
        { name: 'QcTask/example' },
        { name: 'ITSRAWDS/example' },
        { name: 'QcTask/other' },
        { name: 'TOF_RAWS/example' },
        { name: 'QcTask/p2' },
        { name: 'ABC/p2' },
      ];
      assert.deepStrictEqual(getTagsFromServices(ONLINE_SERVICES), expectedTags);
    });

    it('should successfully return an empty list if tags are missing', () => {
      const services = {
        task: {},
        task2: { tag: [] },
        task3: undefined,
      };
      assert.deepStrictEqual(getTagsFromServices(services), []);
    });
  });
};
