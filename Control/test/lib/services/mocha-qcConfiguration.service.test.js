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
  });
});
