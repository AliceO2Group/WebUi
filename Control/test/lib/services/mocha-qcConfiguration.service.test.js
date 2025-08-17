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

const assert = require("assert");
const sinon = require("sinon");

const { QCConfigurationService } = require("../../../lib/services/QCConfiguration.service.js");

describe(`'QCConfigurationService' test suite`, () => {

  describe(`'getKeysOfValidConfigurations' test suite`, () => {
    let qcConfigurationService;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        getOnlyRawValuesByKeyPrefix: sinon.stub().resolves({
          "any/dir1": undefined,
          "any/dir1/prefix1": '{"key1": "value1", "key2": "value2"}',
          "any/prefix1": '{"key1": "value1", "key2": "value2"}',
          "any/prefix2": '"key1": "value1"',
        }),
      });
    });

    it("should return keys of all valid configurations in main directory", async () => {
      const prefix = "any";
      const configurations = await qcConfigurationService.getKeysOfValidConfigurations(prefix);
      assert.deepStrictEqual(configurations, ["any/prefix1"]);
    });

    it("should return keys of all valid configurations in prefix directory when prefix is set", async () => {
      const prefix = "any/dir1";
      const configurations = await qcConfigurationService.getKeysOfValidConfigurations(prefix);
      assert.deepStrictEqual(configurations, ["any/dir1/prefix1"]);
    });

    it("should return keys of all valid configurations when recurse is true", async () => {
      const prefix = "any";
      const configurations = await qcConfigurationService.getKeysOfValidConfigurations(prefix, true);
      assert.deepStrictEqual(configurations, ["any/dir1/prefix1", "any/prefix1"]);
    });

    it("should return an empty array when no valid configurations are found", async () => {
      qcConfigurationService._consulService.getOnlyRawValuesByKeyPrefix.resolves({});
      const prefix = "nonexistent";
      const configurations = await qcConfigurationService.getKeysOfValidConfigurations(prefix);
      assert.deepStrictEqual(configurations, []);
    });
  });

  describe(`'getConfigurationByKey' test suite`, () => {
    let qcConfigurationService;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        getOnlyRawValueByKey: sinon.stub().resolves({key1: "value1", key2: "value2"}),
      });
    });

    it("should return configuration for a valid key", async () => {
      const key = "any/prefix1";
      const configuration = await qcConfigurationService.getConfigurationByKey(key);
      assert.deepStrictEqual(configuration, {key1: "value1", key2: "value2"});
    });

    it("should throw NotFoundError for an invalid key", async () => {
      qcConfigurationService._consulService.getOnlyRawValueByKey.rejects(new Error("Not found"));
      const key = "invalid/key";
      try {
        await qcConfigurationService.getConfigurationByKey(key);
        assert.fail("Expected NotFoundError to be thrown");
      } catch (error) {
        assert.strictEqual(error.message, `Configuration not found for key: ${key}`);
      }
    });
  });

  describe('`filterConfigurations` test suite', () => {
    let qcConfigurationService;

    before(() => {
    // This setup runs once before all tests in this suite
      qcConfigurationService = new QCConfigurationService({});
    });

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

    it('should return an empty array when no valid JSON objects are found', () => {
      const configs = {
        'any/invalid1': 'not a json',
        'any/invalid2': '{"a":1,',
        'any/valid_but_string': '"hello"',
      };

      const result = qcConfigurationService.filterConfigurations(configs, false, 'any');

      assert.deepStrictEqual(result, []);
    });

    it('should return an empty array for null, undefined and empty object input', () => {
      const resultForNull = qcConfigurationService.filterConfigurations(null, false, 'any');
      const resultForUndefined = qcConfigurationService.filterConfigurations(undefined, false, 'any');
      const resultForEmpty = qcConfigurationService.filterConfigurations({}, false, 'any');

      assert.deepStrictEqual(resultForNull, []);
      assert.deepStrictEqual(resultForUndefined, []);
      assert.deepStrictEqual(resultForEmpty, []);
    });
  });
});
