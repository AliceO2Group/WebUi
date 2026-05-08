
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
const { ADMIN_TEST_TOKEN, GUEST_TEST_TOKEN, TEST_URL } = require('../generateToken.js');

describe(`'API - GET - /locks' test suite`, () => {
  before(async () => {
    // release ALL locks via API to prepare test-setup for API PUT tests
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/release/ALL?token=${ADMIN_TEST_TOKEN}`);
  });

  it('should successfully get all locks state', async () => {
    await request(`${TEST_URL}/api/locks`)
      .get(`/?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'FREE' },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' }
      });
  });

  it('should return unauthorized error for missing token requests', async () => {
    await request(`${TEST_URL}/api/locks`)
      .get('/')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid token: jwt must be provided'
      });
  });

  it('should return  unauthorized error for invalid token requests', async () => {
    await request(`${TEST_URL}/api/locks`)
      .get('/?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid token: jwt malformed'
      });
  });

  it('should return  unauthorized error for insufficient role token requests', async () => {
    await request(`${TEST_URL}/api/locks`)
      .get(`/?token=${GUEST_TEST_TOKEN}`)
      .expect(403, {
        status: 403,
        message: 'Not enough permissions for this operation',
        title: 'Unauthorized Access',
      });
  });
});
