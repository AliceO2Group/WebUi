
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
const { ADMIN_TEST_TOKEN, TEST_URL, GUEST_TEST_TOKEN } = require('../generateToken.js');

describe(`'API - GET - /tasks/:id' test suite`, async () => {
  it('should successfully get a task by id', async () => {
    await request(`${TEST_URL}/api/tasks/12345`)
      .get(`/?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        shortInfo: {
          taskId: '12345',
          name: 'Test Task',
          state: 'RUNNING',
        },
        inboundChannels: [],
        outboundChannels: []
      });
  });

  it('should return 404 for non-existing task', async () => {
    await request(`${TEST_URL}/api/tasks/999`)
      .get(`/?token=${ADMIN_TEST_TOKEN}`)
      .expect(404, {
        message: 'gRPC sourced Error: Task not found',
        status: 404,
        title: 'Not Found'
      });
  });

  it('should return 403 for unauthorized access due to limited permissions', async () => {
    // this request is caught by the endpoint middleware
    await request(`${TEST_URL}/api/tasks/1`)
      .get(`/?token=${GUEST_TEST_TOKEN}`)
      .expect(403, {
        status: 403,
        message: 'Not enough permissions for this operation',
        title: 'Unauthorized Access'
      });
  });

  it('should return unauthorized error for invalid token requests', async () => {
    // This request is caught by the web-ui server middleware
    await request(`${TEST_URL}/api/tasks/1`)
      .get('/?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid token: jwt malformed',
      });
  });
});
