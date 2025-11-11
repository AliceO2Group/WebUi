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

const {
  computeRestrictions,
} = require("../../../lib/adapters/QCConfigurationAdapter.js");

describe(`'QCConfigurationAdapter' test suite`, () => {
  it("should work for minimal input", async () => {
    const configuration = {};
    const restrictions = {};
    
    assert.deepStrictEqual(computeRestrictions(configuration), restrictions);
  });

  it("should return restrictions for a big configuration", async () => {
    const configuration = {
      key1: "value1",
      key2: "10",
      key3: [{ key1: "string" }, { key1: "true" }],
      key4: "false",
      key5: { key1: "nested", key2: "false" },
    };
    const restrictions = {
      key1: "string",
      key2: "number",
      key3: "array",
      key4: "boolean",
      key5: { key1: "string", key2: "boolean" },
    };
    
    assert.deepStrictEqual(computeRestrictions(configuration), restrictions);
  });
});
