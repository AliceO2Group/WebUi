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

const CoreUtils = require('./../../lib/control-core/CoreUtils.js');

describe('CoreUtils test suite', () => {
  describe('Check parseMethodNameString', () => {
    it('should successfully remove `/` from beginning of string', () => {
      assert.strictEqual(CoreUtils.parseMethodNameString('/ListDetectors'), 'ListDetectors');
    });

    it('should successfully return method without changing it', () => {
      assert.strictEqual(CoreUtils.parseMethodNameString('ListDetectors'), 'ListDetectors');
    });

    it('should successfully return same as provided for `null/undefined/<empty_string>`', () => {
      assert.strictEqual(CoreUtils.parseMethodNameString(null), null);
      assert.strictEqual(CoreUtils.parseMethodNameString(undefined), undefined);
      assert.strictEqual(CoreUtils.parseMethodNameString(''), '');
    });
  });

  describe('Check parseFrameworkInfo', () => {
    it('should successfully remove unwanted fields from passed info', () => {
      const info = {
        host: 'test',
        frameworkId: 'id',
        detectorsInInstance: ['some-detectors'],
        activeDetectors: ['some-detectors'],
        availableDetectors: ['some-detectors'],
      };
      assert.deepStrictEqual(CoreUtils.parseFrameworkInfo(info), {host: 'test', frameworkId: 'id'});
    });
  });

  describe('Check parseAliEcsVersion', () => {
    it('should successfully build version of AliECS Core', () => {
      const versionJSON = {
        productName: 'AliECS',
        versionStr: '0.16.0',
        build: '7d98d22216'
      };
      const version = CoreUtils.parseAliEcsVersion(versionJSON);
      assert.strictEqual(version, 'AliECS 0.16.0 (revision 7d98d22216)');
    });

    it('should successfully return empty string if version is not provided', () => {
      const versionJSON = {};
      const version = CoreUtils.parseAliEcsVersion(versionJSON);
      assert.strictEqual(version, '');
    });
  });

  describe('Check "parseEnvironmentCreationPayload"', () => {
    it('should throw error if mandatory fields are missing', () => {
      assert.throws(() => CoreUtils.parseEnvironmentCreationPayload({}), new Error(`Missing mandatory parameter 'workflowTemplate' or 'vars'`))
      assert.throws(() => CoreUtils.parseEnvironmentCreationPayload({workflowTemplate: 'some-workflow'}), new Error(`Missing mandatory parameter 'workflowTemplate' or 'vars'`))
      assert.throws(() => CoreUtils.parseEnvironmentCreationPayload({vars: {key: 'value'}}), new Error(`Missing mandatory parameter 'workflowTemplate' or 'vars'`))
    });

    it('should successfully replace new lines with spaces from variables', () => {
      const payload = {
        workflowTemplate: 'some-workflow',
        vars: {
          keyWithNoNewLine: 'value is good to be used',
          keyWithNewLine: 'value\nvalue-value',
          keyWithMultipleNewLines: 'value\nvaluevalue\r\nend',
        }
      };
      const expectedPayload = {
        workflowTemplate: 'some-workflow',
        vars: {
          keyWithNoNewLine: 'value is good to be used',
          keyWithNewLine: 'value value-value',
          keyWithMultipleNewLines: 'value valuevalue end',
        }
      }
      assert.deepStrictEqual(CoreUtils.parseEnvironmentCreationPayload(payload), expectedPayload);
    });
  })
});
