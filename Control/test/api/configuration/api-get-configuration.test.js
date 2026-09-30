
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

describe(`'API - GET - /configurations/:key(*)' test suite`, () => {
  it('should return 200 with the configuration object for an existing key', async () => {
    const expectedBody = { key: 'value' };
    await request(`${TEST_URL}/api/configurations`)
      .get(`/key1?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, expectedBody);
  });

  it('should return 404 when the configuration key does not exist', async () => {
    const expectedError = {
      message: 'Configuration not found for key: nonexistent',
      status: 404,
      title: 'Not Found'
    };
    await request(`${TEST_URL}/api/configurations`)
      .get(`/nonexistent?token=${ADMIN_TEST_TOKEN}`)
      .expect(404, expectedError);
  });

  it('should return 400 when the key parameter is empty', async () => {
    const expectedError = {
      message: 'Missing configuration key',
      status: 400,
      title: 'Invalid Input'
    };
    await request(`${TEST_URL}/api/configurations`)
      .get(`/%20?token=${ADMIN_TEST_TOKEN}`)
      .expect(400, expectedError);
  });

  it('should return 503  when Consul fails to respond', async () => {
    const expectedError = {
      message: 'Consul service unavailable',
      status: 503,
      title: 'Service Unavailable'
    };
    await request(`${TEST_URL}/api/configurations`)
      .get(`/consul-failure?token=${ADMIN_TEST_TOKEN}`)
      .expect(503, expectedError);
  });

  it('should return 403 unauthorized error for missing token requests', async () => {
    await request(`${TEST_URL}/api/configurations`)
      .get('/key1')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid token: jwt must be provided' 
      });
  });

  it('should return 403 unauthorized error for invalid token requests', async () => {
    await request(`${TEST_URL}/api/configurations`)
      .get('/key1?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid token: jwt malformed'
      });
  });
});
