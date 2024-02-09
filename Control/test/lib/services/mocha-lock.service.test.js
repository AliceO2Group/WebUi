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

const assert = require('assert');
const {LockService} = require('./../../../lib/services/Lock.service.js');
const {UnauthorizedAccessError} = require('../../../lib/errors/UnauthorizedAccessError.js');
const {Lock} = require('./../../../lib/dtos/Lock.js');
const {User} = require('./../../../lib/dtos/User.js');
const {LockState} = require('./../../../lib/common/lock/lockState.enum.js');

describe(`'LockService' test suite`, () => {
  let fakeBroadcast;
  let lockService;

  let userA;
  let userB;

  let lockAbc = new Lock('ABC');
  let lockXyz = new Lock('XYZ')

  before(() => {
    fakeBroadcast = {
      broadcast: () => null
    };
    lockService = new LockService(fakeBroadcast);
    userA = new User('userA', 1, 'admin');
    userB = new User('userB', 2, 'global');
  });

  it('should successfully return an empty state of locks initially as there are no detectors', () => {
    assert.deepStrictEqual(lockService.locksByDetector, {});
  });

  it('should successfully have an object of FREE locks after detectors are provided', () => {
    lockService.setLockStatesForDetectors(['ABC', 'XYZ']);

    assert.deepStrictEqual(lockService.locksByDetector, {
      ABC: lockAbc,
      XYZ: lockXyz
    });
    assert.strictEqual(lockService.locksByDetector['ABC'].state, LockState.FREE);
    assert.strictEqual(lockService.locksByDetector['XYZ'].state, LockState.FREE);
  });

  it('should successfully take a lock for provided credentials user', () => {
    lockAbc.assignUser(userA);
    assert.deepStrictEqual(lockService.takeLock('ABC', userA), {
      ABC: lockAbc,
      XYZ: lockXyz
    });

    lockXyz.assignUser(userB);
    assert.deepStrictEqual(lockService.takeLock('XYZ', userB), {
      ABC: lockAbc,
      XYZ: lockXyz
    });
  });

  it('should successfully keep lock of user when they try to take the same lock', () => {
    assert.deepStrictEqual(lockService.takeLock('XYZ', userB), {
      ABC: lockAbc,
      XYZ: lockXyz
    });
  });

  it('should throw error when a user attempts to take a lock that is already held by another user', () => {
    assert.throws(
      () => lockService.takeLock('ABC', userB),
      new UnauthorizedAccessError(`Unauthorized TAKE action for lock of detector ABC`)
    );
  });

  it('should successfully take a lock by force from another user', () => {
    lockAbc.assignUser(userB);
    assert.deepStrictEqual(lockService.takeLock('ABC', userB, true), {
      ABC: lockAbc,
      XYZ: lockXyz
    });
  });

  it('should successfully release a lock for provided credentials user if user is currently owner', () => {
    lockAbc.removeUser();
    assert.deepStrictEqual(lockService.releaseLock('ABC', userB), {
      ABC: lockAbc,
      XYZ: lockXyz
    });
  });

  it('should successfully keep lock released when user tries to release a lock that is not owned', () => {
    assert.deepStrictEqual(lockService.releaseLock('ABC', userB), {
      ABC: lockAbc,
      XYZ: lockXyz
    });
  });

  it('should throw error when a user attempts to release a lock that is held by another user', () => {
    assert.throws(
      () => lockService.releaseLock('XYZ', userA),
      new UnauthorizedAccessError(`Unauthorized RELEASE action for lock of detector XYZ`)
    );
  });

  it('should successfully release a lock by force from another user', () => {
    lockXyz.removeUser();
    assert.deepStrictEqual(lockService.releaseLock('XYZ', userA, true), {
      ABC: lockAbc,
      XYZ: lockXyz
    });
  });
});
