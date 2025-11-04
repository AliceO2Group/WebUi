
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

const request = require('supertest');
const { ADMIN_TEST_TOKEN, TEST_URL } = require('../generateToken.js');
const { consul: { qcPath } } = require('../../test-config');

describe(`'API - GET - /configurations' test suite`, () => {
  it('should return 200 with valid configuration keys', async () => {
    await request(`${TEST_URL}/api`)
      .get(`/configurations?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, ['key1']);
  });
  
  it('should return 404 when the prefix is valid but contains no keys', async () => {
    const prefix = 'empty-prefix';
    const expectedError = {
      message: "No valid configurations found",
      status: 404,
      title: "Not Found"
    };
    await request(`${TEST_URL}/api`)
      .get(`/configurations?prefix=${prefix}&token=${ADMIN_TEST_TOKEN}`)
      .expect(404, expectedError);
  });

  it('should return 404 when the specified prefix does not exist', async () => {
    const prefix = 'nonexistent-prefix';
    const expectedError = {
      message: `Configurations prefix not found: '${qcPath}/ANY/any/${prefix}'`,
      status: 404,
      title: "Not Found"
    };
    await request(`${TEST_URL}/api`)
      .get(`/configurations?prefix=${prefix}&token=${ADMIN_TEST_TOKEN}`)
      .expect(404, expectedError);
  });

  it('should return 503 when Consul returns an internal error', async () => {
    const prefix = 'server-error-prefix';
    const expectedError = {
      message: "Consul service unavailable",
      status: 503,
      title: "Service Unavailable"
    };
    await request(`${TEST_URL}/api`)
      .get(`/configurations?prefix=${prefix}&token=${ADMIN_TEST_TOKEN}`)
      .expect(503, expectedError);
  });

  it('should return 403 unauthorized error for missing token requests', async () => {
    await request(`${TEST_URL}/api`)
      .get('/configurations')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'You must provide a JWT token'
      });
  });

  it('should return 403 unauthorized error for invalid token requests', async () => {
    await request(`${TEST_URL}/api`)
      .get('/configurations?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid JWT token provided'
      });
  });
});
