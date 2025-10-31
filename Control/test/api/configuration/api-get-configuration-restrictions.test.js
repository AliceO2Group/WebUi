
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

describe(`'API - GET - /configuration/restrictions' test suite`, () => {
  it('should successfully get a restriction TypeMap for given configurations', async () => {
    await request(`${TEST_URL}/api/configuration/restrictions`)
      .get(`/?key=o2/components/qc/ANY/any/ctp-raw-qc-full&token=${ADMIN_TEST_TOKEN}`)
      .expect(200);
  });

  it('should return unauthorized error for missing token requests', async () => {
    await request(`${TEST_URL}/api/configuration/restrictions`)
      .get('/')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'You must provide a JWT token'
      });
  });

  it('should return  unauthorized error for invalid token requests', async () => {
    await request(`${TEST_URL}/api/configuration/restrictions`)
      .get('/?token=invalid-token')
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid JWT token provided'
      });
  });
});
