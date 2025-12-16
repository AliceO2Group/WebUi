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
const sinon = require('sinon');

const { QCConfigurationService } = require('../../../lib/services/QCConfiguration.service.js');

describe(`'QCConfigurationService' test suite`, () => {
  let consulServiceStub, qcConfigurationService;

  beforeEach(() => {
    consulServiceStub = {
      getOnlyRawValuesByKeyPrefix: sinon.stub(),
      getOnlyRawValueByKey: sinon.stub(),
    };
    qcConfigurationService = new QCConfigurationService(consulServiceStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe(`'retrieveKeysOfValidConfigurations' test suite`, () => {
    it('should return keys of valid configurations only in the root of the prefix (recurse=false)', async () => {
      const prefix = 'any';
      const rawData = {
        'any/dir1/nested': '{"key": "value"}',
        'any/valid1': '{"key1": "value1"}',
        'any/invalid_json': '"key1": "value1"',
        'any/valid2': '{}',
      };
      consulServiceStub.getOnlyRawValuesByKeyPrefix.resolves(rawData);

      const configurations = await qcConfigurationService.retrieveKeysOfValidConfigurations(prefix, false);

      assert.ok(consulServiceStub.getOnlyRawValuesByKeyPrefix.calledOnceWith(prefix));
      assert.deepStrictEqual(configurations, ['any/valid1', 'any/valid2']);
    });

    it('should return keys of all valid configurations when recurse is true', async () => {
      const prefix = 'any';
      const rawData = {
        'any/dir1/nested': '{"key": "value"}',
        'any/valid1': '{"key1": "value1"}',
        'any/dir1/invalid': 'just string',
      };
      consulServiceStub.getOnlyRawValuesByKeyPrefix.resolves(rawData);

      const configurations = await qcConfigurationService.retrieveKeysOfValidConfigurations(prefix, true);

      assert.ok(consulServiceStub.getOnlyRawValuesByKeyPrefix.calledOnceWith(prefix));
      assert.deepStrictEqual(configurations, ['any/dir1/nested', 'any/valid1']);
    });

    it('should return an empty array when consul service returns no data', async () => {
      const prefix = 'nonexistent';
      consulServiceStub.getOnlyRawValuesByKeyPrefix.resolves({});

      const configurations = await qcConfigurationService.retrieveKeysOfValidConfigurations(prefix);

      assert.ok(consulServiceStub.getOnlyRawValuesByKeyPrefix.calledOnceWith(prefix));
      assert.deepStrictEqual(configurations, []);
    });

    it('should propagate errors from the consul service', async () => {
      const testError = new Error('Consul not working');
      consulServiceStub.getOnlyRawValuesByKeyPrefix.rejects(testError);

      await assert.rejects(
        async () => await qcConfigurationService.retrieveKeysOfValidConfigurations('any'),
        testError
      );
    });
  });

  describe(`'retrieveConfigurationByKey' test suite`, () => {
    it('should return configuration for a valid key', async () => {
      const key = 'any/prefix1';
      const expectedConfig = { key1: 'value1', key2: 'value2' };
      consulServiceStub.getOnlyRawValueByKey.resolves(expectedConfig);

      const configuration = await qcConfigurationService.retrieveConfigurationByKey(key);

      assert.ok(consulServiceStub.getOnlyRawValueByKey.calledOnceWith(key));
      assert.deepStrictEqual(configuration, expectedConfig);
    });
    
    it('should propagate errors from the consul service', async () => {
      const testError = new Error('Consul not working');
      consulServiceStub.getOnlyRawValueByKey.rejects(testError);

      await assert.rejects(
        async () => await qcConfigurationService.retrieveConfigurationByKey('any'),
        testError
      );
    });
  });

  describe('`filterConfigurations` test suite', () => {
    it('should return keys of valid JSON objects and ignore others when recurse is false', () => {
      const configs = {
        'any/valid_object': '{"key": "value"}',
        'any/empty_object': '{}',
        'any/nested/key': '{"a": 1}',
        'any/not_a_json': 'just a plain string',
        'any/malformed_json': '{"key":',
        'any/json_string': '"a valid json string"',
        'any/json_array': '[1, 2, 3]',
        'any/json_null': 'null',
      };
      const expectedKeys = ['any/valid_object', 'any/empty_object'];
      
      const result = qcConfigurationService.filterConfigurations(configs, false, 'any');
      assert.deepStrictEqual(result, expectedKeys);
    });

    it('should include nested keys when recurse is true', () => {
      const configs = {
        'any/valid_object': '{"key": "value"}',
        'any/nested/key': '{"a": 1}',
        'any/nested/invalid': 'not json',
      };
      const expectedKeys = ['any/valid_object', 'any/nested/key'];

      const result = qcConfigurationService.filterConfigurations(configs, true, 'any');
      assert.deepStrictEqual(result, expectedKeys);
    });

    it('should return an empty array for null, undefined and empty object input', () => {
      assert.deepStrictEqual(qcConfigurationService.filterConfigurations(null, false, 'any'), []);
      assert.deepStrictEqual(qcConfigurationService.filterConfigurations(undefined, false, 'any'), []);
      assert.deepStrictEqual(qcConfigurationService.filterConfigurations({}, false, 'any'), []);
    });
  });

  describe(`'getConfigurationRestrictionsByKey' test suite`, () => {
    it('should return restrictions for a valid key', async () => {
      const key = 'any/prefix1';
      const mockConfiguration = { key1: 'value1', key2: 'value2' };
      const expectedRestrictions = { key1: 'string', key2: 'string' };
      consulServiceStub.getOnlyRawValueByKey.resolves(mockConfiguration);

      const restrictions = await qcConfigurationService.getConfigurationRestrictionsByKey(key);

      assert.ok(consulServiceStub.getOnlyRawValueByKey.calledOnceWith(key));
      assert.deepStrictEqual(restrictions, expectedRestrictions);
    });
    
    it('should propagate errors from the consul service', async () => {
      const testError = new Error('Consul not working');
      consulServiceStub.getOnlyRawValueByKey.rejects(testError);

      await assert.rejects(
        async () => await qcConfigurationService.getConfigurationRestrictionsByKey('any'),
        testError
      );
    });
  });

  describe(`'editConfigurationByKey' test suite`, () => {
    let qcConfigurationService;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        putListOfKeyValues: sinon.stub().resolves({ allPut: true }),
      });
    });

    it('should return {allPut: true} for a valid key and configuration', async () => {
      const key = 'any/prefix1';
      const value = { key: 'value' };
      const editStatus = await qcConfigurationService.editConfigurationByKey(key, value);
      assert.deepStrictEqual(editStatus, { allPut: true });
    });
  });
});
