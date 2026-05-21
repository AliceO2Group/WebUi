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
const { ADMIN_TEST_TOKEN, DET_MID_TEST_TOKEN, GUEST_TEST_TOKEN, TEST_URL } = require('../generateToken.js');
const { DetectorLockAction } = require('../../../lib/common/lock/detectorLockAction.enum.js');
const { EnvironmentTransitionType } = require('../../../lib/common/environmentTransitionType.enum.js');

const ENVIRONMENT_ID = '6f6d6387-6577-11e8-993a-f07959157220';

describe(`'API - PUT - /environment/:id' test suite`, () => {
  before(async () => {
    // Ensure all locks are released before running tests
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/release/ALL?token=${ADMIN_TEST_TOKEN}`);
  });

  after(async () => {
    // Release all locks after tests to avoid side effects on other suites
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/release/ALL?token=${ADMIN_TEST_TOKEN}`);
  });

  it('should reject unauthenticated requests', async () => {
    await request(`${TEST_URL}/api`)
      .put(`/environment/${ENVIRONMENT_ID}`)
      .send({ id: ENVIRONMENT_ID, type: EnvironmentTransitionType.CONFIGURE })
      .expect(403, {
        message: 'Invalid token: jwt must be provided',
        error: '403 - Json Web Token Error'
      });
  });

  it('should reject request from user with insufficient role (guest)', async () => {
    await request(`${TEST_URL}/api`)
      .put(`/environment/${ENVIRONMENT_ID}?token=${GUEST_TEST_TOKEN}`)
      .send({ id: ENVIRONMENT_ID, type: EnvironmentTransitionType.CONFIGURE })
      .expect(403, {
        message: 'Not enough permissions for this operation',
        status: 403,
        title: 'Unauthorized Access'
      });
  });

  it('should reject request when environment id is missing from body', async () => {
    await request(`${TEST_URL}/api`)
      .put(`/environment/${ENVIRONMENT_ID}?token=${DET_MID_TEST_TOKEN}`)
      .send({ type: EnvironmentTransitionType.CONFIGURE })
      .expect(400, {
        message: 'Invalid input: environment id must be provided',
        status: 400,
        title: 'Invalid Input'
      });
  });

  it('should reject request when user does not own the lock for the environment detectors', async () => {
    await request(`${TEST_URL}/api`)
      .put(`/environment/${ENVIRONMENT_ID}?token=${DET_MID_TEST_TOKEN}`)
      .send({ id: ENVIRONMENT_ID, type: EnvironmentTransitionType.CONFIGURE })
      .expect(403, {
        message: 'Action not allowed for user Detector User due to missing ownership of lock(s)',
      });
  });

  it('should reject request with an invalid transition type', async () => {
    // Acquire the lock for MID so the request can proceed to the handler
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200);

    await request(`${TEST_URL}/api`)
      .put(`/environment/${ENVIRONMENT_ID}?token=${DET_MID_TEST_TOKEN}`)
      .send({ id: ENVIRONMENT_ID, type: 'INVALID_TRANSITION' })
      .expect(400, {
        message: 'Invalid environment transition to perform',
        status: 400,
        title: 'Invalid Input'
      });

    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.RELEASE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200);
  });

  it('should successfully transition environment when user owns the lock', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200);

    await request(`${TEST_URL}/api`)
      .put(`/environment/${ENVIRONMENT_ID}?token=${DET_MID_TEST_TOKEN}`)
      .send({ id: ENVIRONMENT_ID, type: EnvironmentTransitionType.CONFIGURE })
      .expect(200)
      .expect((res) => {
        if (res.body.id !== ENVIRONMENT_ID) {
          throw new Error(`Expected environment id ${ENVIRONMENT_ID}, got ${res.body.id}`);
        }
      });

    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.RELEASE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200);
  });
});
