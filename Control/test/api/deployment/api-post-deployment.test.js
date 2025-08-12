/**
 * @license
 * Copyright 2019-2025 CERN and copyright holders of ALICE O2.
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
const { DET_MID_TEST_TOKEN, GUEST_TEST_TOKEN, TEST_URL } = require('../generateToken.js');
const { DetectorLockAction } = require('../../../lib/common/lock/detectorLockAction.enum.js');

describe('POST /deploy', function () {
  it('should reject unauthenticated requests from WebUI server', async function () {
    await request(`${TEST_URL}/api`)
      .post('/deploy')
      .send({
        workflowTemplate: 'test-template',
        selectedConfiguration: 'test-config',
        userVars: { foo: 'bar' }
      })
      .expect(403, {
        message: 'You must provide a JWT token',
        error: '403 - Json Web Token Error'
      });
  });

  it('should reject deployment request due to user not being detector as minimum role', async function () {
    await request(`${TEST_URL}/api`)
      .post(`/deploy?token=${GUEST_TEST_TOKEN}`)
      .send({
        workflowTemplate: 'test-template',
        selectedConfiguration: 'test-config',
        userVars: { foo: 'bar' }
      })
      .expect(403, {
        message: 'Not enough permissions for this operation',
        status: 403,
        title: 'Unauthorized Access'
      });
  });

  it('should reject deployment request due to missing lock ownership', async function () {
    await request(`${TEST_URL}/api`)
      .post(`/deploy?token=${DET_MID_TEST_TOKEN}`)
      .send({
        workflowTemplate: 'test-template',
        selectedConfiguration: 'test-config',
        detectors: ['MID'],
        userVars: { foo: 'bar' }
      })
      .expect(403, {
        message: 'Action not allowed for user Detector User due to missing ownership of lock(s)',
      });
  });

  it('should reject requests with missing workflowTemplate and selectedConfiguration', async function () {
    // First we need to acquire the lock for MID detector
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'det-mid', fullName: 'Detector User', personid: 2 } },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' }
      });

    await request(`${TEST_URL}/api`)
      .post(`/deploy?token=${DET_MID_TEST_TOKEN}`)
      .send({
        detectors: ['MID'],
        userVars: { foo: 'bar' }
      })
      .expect(400, {
        message: 'Invalid input: workflowTemplate or selectedConfiguration must be provided',
        status: 400,
        title: 'Invalid Input'
      });
    
    // Release the lock after the test so that tests are not chained
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.RELEASE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'det-mid', fullName: 'Detector User', personid: 2 } },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' }
      });
  });
});
