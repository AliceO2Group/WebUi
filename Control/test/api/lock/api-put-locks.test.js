
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
const { ADMIN_TEST_TOKEN, TEST_URL, DET_MID_TEST_TOKEN, GUEST_TEST_TOKEN, GLOBAL_TEST_TOKEN } = require('../generateToken.js');
const { DetectorLockAction } = require('../../../lib/common/lock/detectorLockAction.enum.js');

describe(`'API - PUT - /locks/:action/:detectorId' test suite`, () => {
  before(async () => {
    // release ALL locks via API to prepare test-setup for API PUT tests
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/release/ALL?token=${ADMIN_TEST_TOKEN}`);
  });

  it('should successfully take lock as detector user for their detector', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'det-mid', fullName: 'Detector User', personid: 2 } },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' }
      });
  });
  
  it('should return unauthorized error for attempt to take already owned lock', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/MID?token=${ADMIN_TEST_TOKEN}`)
      .expect(403, {
        message: 'Unauthorized TAKE action for lock of detector MID by user Admin User'
      });
  });

  it('should return unauthorized error for attempt to take lock as Guest User', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/DCS?token=${GUEST_TEST_TOKEN}`)
      .expect(403, {
        message: 'Not enough permissions for this operation'
      });
  });

  it('should successfully FORCE take lock as ADMIN user', async () => {
    await request(`${TEST_URL}/api/locks/force`)
      .put(`/${DetectorLockAction.TAKE}/MID?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' }
      });
  });

  it('should successfully FORCE take lock as GLOBAL user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/${DetectorLockAction.TAKE}/MID?token=${GLOBAL_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' }
      });
  });

  it('should successfully take lock as ADMIN user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/DCS?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
        DCS: { name: 'DCS', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
        ODC: { name: 'ODC', state: 'FREE' }
      });
  });

  it('should successfully take ALL available lock as Global user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/ALL?token=${GLOBAL_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
        DCS: { name: 'DCS', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
        ODC: { name: 'ODC', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
      });
  });

  it('should successfully FORCE take ALL available lock as Global user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/${DetectorLockAction.TAKE}/ALL?token=${GLOBAL_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
        DCS: { name: 'DCS', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
        ODC: { name: 'ODC', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
      });
  });

  it('should successfully FORCE take ALL available lock as Admin user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/${DetectorLockAction.TAKE}/ALL?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
        DCS: { name: 'DCS', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
        ODC: { name: 'ODC', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
      });
  });

  it('should return error for attempt to release a lock as a guest user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.RELEASE}/MID?token=${GUEST_TEST_TOKEN}`)
      .expect(403, {
        message: 'Not enough permissions for this operation'
      });
  });

  it('should return error for attempt to release a lock not owned by user', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.RELEASE}/MID?token=${DET_MID_TEST_TOKEN}`)
      .expect(403, {
        message: 'Unauthorized RELEASE action for lock of detector MID by user Detector User'
      });
  });

  it('should successfully release a lock', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.RELEASE}/MID?token=${ADMIN_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'FREE' },
        DCS: { name: 'DCS', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
        ODC: { name: 'ODC', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
      });
  });

  it('should successfully force release a lock from another user as Global', async () => {
    await request(`${TEST_URL}/api/locks`)
      .put(`/force/${DetectorLockAction.RELEASE}/DCS?token=${GLOBAL_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'FREE' },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
      });
  });
  
  it('should successfully force release ALL locks from all users', async () => {
    // first we retake a lock to ensure we have a lock to release from different types of users
    await request(`${TEST_URL}/api/locks`)
      .put(`/${DetectorLockAction.TAKE}/DCS?token=${GLOBAL_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'FREE' },
        DCS: { name: 'DCS', state: 'TAKEN', owner: { username: 'global', fullName: 'Global User', personid: 1 } },
        ODC: { name: 'ODC', state: 'TAKEN', owner: { username: 'admin', fullName: 'Admin User', personid: 0 } },
    });

    await request(`${TEST_URL}/api/locks`)
      .put(`/force/${DetectorLockAction.RELEASE}/ALL?token=${GLOBAL_TEST_TOKEN}`)
      .expect(200, {
        MID: { name: 'MID', state: 'FREE' },
        DCS: { name: 'DCS', state: 'FREE' },
        ODC: { name: 'ODC', state: 'FREE' },
      });
  });
});
