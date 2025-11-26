
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

describe(`'API - GET - /configurations/restrictions' test suite`, () => {
  it('should successfully get a Restrictions object for given configurations', async () => {
    await request(`${TEST_URL}/api/configurations/restrictions`)
      .get(`/key1?token=${ADMIN_TEST_TOKEN}`)
      .expect(200);
  });
  
  it('should return 400 when the key parameter is missing', async () => {
    const expectedError = {
      message: 'Missing configuration key',
      status: 400,
      title: 'Invalid Input'
    };
    await request(`${TEST_URL}/api/configurations/restrictions`)
      .get(`/%20?token=${ADMIN_TEST_TOKEN}`)
      .expect(400, expectedError);
  });

  it('should return 403 unauthorized for missing token requests', async () => {
    await request(`${TEST_URL}/api/configurations/restrictions`)
      .get('/')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'You must provide a JWT token'
      });
  });

  it('should return 403 unauthorized for invalid token requests', async () => {
    await request(`${TEST_URL}/api/configurations/restrictions`)
      .get('/?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid JWT token provided'
      });
  });
  
  it('should return 404 when the configuration key does not exist', async () => {
    const expectedError = {
      message: 'Configuration not found for key: nonexistent',
      status: 404,
      title: 'Not Found'
    };
    await request(`${TEST_URL}/api/configurations/restrictions`)
      .get(`/nonexistent?token=${ADMIN_TEST_TOKEN}`)
      .expect(404, expectedError);
  });
  
  it('should return 503  when Consul fails to respond', async () => {
    const expectedError = {
      message: 'Consul service unavailable',
      status: 503,
      title: 'Service Unavailable'
    };
    await request(`${TEST_URL}/api/configurations/restrictions`)
      .get(`/consul-failure?token=${ADMIN_TEST_TOKEN}`)
      .expect(503, expectedError);
  });
});
