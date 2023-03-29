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
import { isObjectOfTypeChecker, OBJECT_TYPE_KEY } from './../../../../common/library/qcObject/utils.js';

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
};
