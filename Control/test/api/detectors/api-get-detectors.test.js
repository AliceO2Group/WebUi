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

const assert = require('assert');
const request = require('supertest');
const test = require('../../mocha-index');
const {ADMIN_TEST_TOKEN, TEST_URL} = require('../generateToken.js');

describe("'API - GET - /core/detectors' test suite", () => {
  let apricotCalls;

  before(() => {
    apricotCalls = test.helpers.apricotCalls;
  });

  beforeEach(() => {
    apricotCalls['listDetectors'] = undefined;
  });

  it('should successfully retrieve detectors', async () => {
    await request(`${TEST_URL}/api`)
      .get(`/core/detectors?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {detectors: ['MID', 'DCS', 'ODC']}); // @link{test/config/apricot-grpc.js}
  });

  it('should serve detectors from in-memory cache without calling apricot again', async () => {
    // First request can either warm the cache or use an already warm cache.
    await request(`${TEST_URL}/api`)
      .get(`/core/detectors?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {detectors: ['MID', 'DCS', 'ODC']});

    apricotCalls['listDetectors'] = undefined;

    await request(`${TEST_URL}/api`)
      .get(`/core/detectors?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {detectors: ['MID', 'DCS', 'ODC']});

    assert.strictEqual(apricotCalls['listDetectors'], undefined);
  });
});
