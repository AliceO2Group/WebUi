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

describe(`'API - PUT - /configurations/:key(*)' test suite`, () => {

  const validPayload = { configuration: { newKey: 'newValue' } };

  it('should return 200 with { allPut: true } when configuration is updated', async () => {
    const expectedBody = { allPut: true };
    await request(`${TEST_URL}/api/configurations`)
      .put(`/key1?token=${ADMIN_TEST_TOKEN}`)
      .send(validPayload)
      .expect(200, expectedBody);
  });

  it('should return 400 when the key parameter is empty', async () => {
    const expectedError = {
      message: 'Missing configuration key',
      status: 400,
      title: 'Invalid Input'
    };
    await request(`${TEST_URL}/api/configurations`)
      .put(`/%20?token=${ADMIN_TEST_TOKEN}`)
      .send(validPayload)
      .expect(400, expectedError);
  });

  it('should return 200 with { allPut: false } when Consul transaction fails', async () => {
    const expectedBody = { allPut: false };
    
    await request(`${TEST_URL}/api/configurations`)
      .put(`/consul-failure?token=${ADMIN_TEST_TOKEN}`)
      .send(validPayload)
      .expect(200, expectedBody);
  });

  it('should return 403 unauthorized error for missing token requests', async () => {
    await request(`${TEST_URL}/api/configurations`)
      .put('/key1')
      .send(validPayload)
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'You must provide a JWT token'
      });
  });

  it('should return 403 unauthorized error for invalid token requests', async () => {
    await request(`${TEST_URL}/api/configurations`)
      .put('/key1?token=invalid-token')
      .send(validPayload)
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid JWT token provided'
      });
  });
});
