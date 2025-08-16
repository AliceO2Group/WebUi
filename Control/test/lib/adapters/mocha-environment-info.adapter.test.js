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
/* eslint-disable max-len */

const assert = require('assert');
const EnvironmentInfoAdapter = require('../../../lib/adapters/EnvironmentInfoAdapter');

describe('EnvironmentInfoAdapter test suite', () => {
  describe('_filterOutDetectorsVariables() - tests', async () => {
    it('should successfully filter out variables which do not belong to a detector', async () => {
      const detectors = ['TST', 'CPV', 'MFT'];
      const includedDetectors = ['TST'];
      
      const vars = {
        tst_some: 'test',
        tst_other: 'test',
        cpv_some: 'test',
        cpv_other: 'test',
        mft_some: 'test',
        mft_other: 'test',
      }
      assert.deepStrictEqual(EnvironmentInfoAdapter._filterOutDetectorsVariables(vars, includedDetectors, detectors), {tst_some:'test', tst_other: 'test'});
    });

    it('should successfully return empty object if empty object is passed', () => {
      assert.deepStrictEqual(EnvironmentInfoAdapter._filterOutDetectorsVariables({}, [], []), {});
    });

    it('should successfully return same object object if detectors list is empty', () => {
      const includedDetectors = ['TST'];
      const vars = {
        tst_some: 'test',
        tst_other: 'test',
        cpv_some: 'test',
        cpv_other: 'test',
        mft_some: 'test',
        mft_other: 'test',
      }
      assert.deepStrictEqual(EnvironmentInfoAdapter._filterOutDetectorsVariables(vars, includedDetectors, []), vars);
    });

    it('should successfully filter out variables object object if includedDetectors list is empty', () => {
      const vars = {
        tst_some: 'test',
        tst_other: 'test',
        cpv_some: 'test',
        cpv_other: 'test',
        mft_some: 'test',
        mft_other: 'test',
      }
      assert.deepStrictEqual(EnvironmentInfoAdapter._filterOutDetectorsVariables(vars, [], ['TST', 'CPV', 'MFT']), {});
    });

    it('should successfully filter out variables object object if both detectors lists are empty', () => {
      const vars = {
        tst_some: 'test',
        tst_other: 'test',
        cpv_some: 'test',
        cpv_other: 'test',
        mft_some: 'test',
        mft_other: 'test',
      }
      assert.deepStrictEqual(EnvironmentInfoAdapter._filterOutDetectorsVariables(vars, [], []), vars);
    });
  });
});
