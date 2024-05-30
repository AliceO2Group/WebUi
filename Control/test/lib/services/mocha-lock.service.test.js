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
const {DetectorLock} = require('./../../../lib/dtos/DetectorLock.js');
const {LockService} = require('./../../../lib/services/Lock.service.js');
const {NotFoundError} = require('../../../lib/errors/NotFoundError.js');
const {UnauthorizedAccessError} = require('../../../lib/errors/UnauthorizedAccessError.js');
const {User} = require('./../../../lib/dtos/User.js');

describe(`'LockService' test suite`, () => {
  let fakeBroadcast;
  let lockService;

  let userA;
  let userB;

  let lockAbc = new DetectorLock('ABC');
  let lockXyz = new DetectorLock('XYZ')

  before(() => {
    fakeBroadcast = {
      broadcast: () => null
    };
    lockService = new LockService(fakeBroadcast);
    userA = new User('usera', 'userA', 1, 'admin');
    userB = new User('userB', 'userB', 2, 'global');
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
    assert.ok(lockService.locksByDetector['ABC'].isFree());
    assert.ok(lockService.locksByDetector['XYZ'].isFree());
  });

  it('should successfully register lock to user that requests it', () => {
    assert.ok(lockService.locksByDetector['ABC'].isFree());
    lockService.takeLock('ABC', userA);
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    assert.ok(lockService.locksByDetector['ABC'].isOwnedBy(userA)); 
  });

  it('should successfully keep lock of user when they try to take the same lock', () => {
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    lockService.takeLock('ABC', userA);
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    assert.ok(lockService.locksByDetector['ABC'].isOwnedBy(userA)); 
  });

  it('should throw error when a user attempts to take a lock that is already held by another user', () => {
    assert.throws(
      () => lockService.takeLock('ABC', userB),
      new UnauthorizedAccessError(`Unauthorized TAKE action for lock of detector ABC by user userB`)
    );
  });

  it('should successfully take a lock by force from another user', () => {
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    assert.ok(!lockService.locksByDetector['ABC'].isOwnedBy(userB)); 
    lockService.takeLock('ABC', userB, true);
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    assert.ok(lockService.locksByDetector['ABC'].isOwnedBy(userB)); 
  });

  it('should successfully release a lock for provided credentials user if user is currently owner', () => {
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    lockService.releaseLock('ABC', userB);
    assert.ok(lockService.locksByDetector['ABC'].isFree());
  });

  it('should successfully keep lock released when user tries to release a lock that is not owned', () => {
    assert.ok(lockService.locksByDetector['ABC'].isFree());
    lockService.releaseLock('ABC', userB);
    assert.ok(lockService.locksByDetector['ABC'].isFree());
  });

  it('should throw error when a user attempts to release a lock that is held by another user', () => {
    lockService.takeLock('ABC', userA);
    assert.throws(
      () => lockService.releaseLock('ABC', userB),
      new UnauthorizedAccessError(`Unauthorized RELEASE action for lock of detector ABC by user userB`)
    );
  });

  it('should successfully release a lock by force from another user', () => {
    assert.ok(lockService.locksByDetector['ABC'].isTaken());
    lockService.releaseLock('ABC', userB, true);
    assert.ok(lockService.locksByDetector['ABC'].isFree());
  });

  it('should throw not found error for detector name that does not exist on release and take action', () => {
    
    assert.throws(
      () => lockService.releaseLock('ABCDEFG', userB, true),
      new NotFoundError(`Detector ABCDEFG not found in the list of detectors`)
    );

    assert.throws(
      () => lockService.takeLock('ABCDEFG', userB, true),
      new NotFoundError(`Detector ABCDEFG not found in the list of detectors`)
    );
  });
});
