
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
const { ADMIN_TEST_TOKEN, TEST_URL, DET_MID_TEST_TOKEN } = require('../generateToken.js');

describe(`'API - DELETE - /tasks/:id' test suite`, async () => {
  it('should successfully delete tasks as ADMIN', async () => {
    await request(`${TEST_URL}/api/tasks`)
      .delete(`/?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        killedTasks: [],
        runningTasks: []
      });
  });

  it('should return 408 timeout status and error if grpc method failed', async () => {
    await request(`${TEST_URL}/api/tasks`)
      .delete(`/?token=${ADMIN_TEST_TOKEN}`)
      .expect(408, {
        status: 408,
        message: 'gRPC sourced Error: Cleanup timed out',
        title: 'Timeout'
      });
  });

  it('should return 403 for unauthorized access due to limited permissions', async () => {
    // this request is caught by the endpoint middleware
    await request(`${TEST_URL}/api/tasks`)
      .delete(`/?token=${DET_MID_TEST_TOKEN}`)
      .expect(403, {
        status: 403,
        message: 'Not enough permissions for this operation',
        title: 'Unauthorized Access'
      });
  });

  it('should return unauthorized error for invalid token requests', async () => {
    // This request is caught by the web-ui server middleware
    await request(`${TEST_URL}/api/tasks`)
      .delete('/?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid token: jwt malformed',
      });
  });
});
