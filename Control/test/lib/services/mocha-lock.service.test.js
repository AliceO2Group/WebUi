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
const {LockService} = require('../../../lib/services/Lock.service.js');
const {UnauthorizedAccessError} = require('../../../lib/errors/UnauthorizedAccessError.js');

describe(`'LockService' test suite`, () => {
  let fakeWs;
  let lockService;
  before(() => {
    fakeWs = {
      broadcast: () => null
    };
    lockService = new LockService(fakeWs);
  });

  it('should successfully return an empty state of locks initially', () => {
    assert.deepStrictEqual(lockService.state(), {
      lockedBy: {},
      lockedByName: {}
    })
  });

  it('should successfully take a lock for provided credentials user', () => {
    assert.deepStrictEqual(lockService.takeLock('ABC', 0, 'Anonymous'), {
      lockedBy: {
        ABC: 0
      },
      lockedByName: {
        ABC: 'Anonymous'
      }
    });

    assert.deepStrictEqual(lockService.takeLock('XYZ', 1, 'OneTime'), {
      lockedBy: {
        ABC: 0,
        XYZ: 1,
      },
      lockedByName: {
        ABC: 'Anonymous',
        XYZ: 'OneTime'
      }
    });
  });

  it('should successfully keep lock of user when they try to take the same lock', () => {
    assert.deepStrictEqual(lockService.takeLock('XYZ', 1, 'OneTime'), {
      lockedBy: {
        ABC: 0,
        XYZ: 1,
      },
      lockedByName: {
        ABC: 'Anonymous',
        XYZ: 'OneTime'
      }
    });
  });

  it('should throw error when a user attempts to take a lock that is already held by another user', () => {
    assert.throws(
      () => lockService.takeLock('ABC', 1, 'OneTime'),
      new UnauthorizedAccessError(`Lock ABC is already held by Anonymous (id 0)`)
    );
  });

  it('should successfully take a lock by force from another user', () => {
    assert.deepStrictEqual(lockService.takeLock('ABC', 1, 'OneTime', true), {
      lockedBy: {
        ABC: 1,
        XYZ: 1,
      },
      lockedByName: {
        ABC: 'OneTime',
        XYZ: 'OneTime'
      }
    });
  });

  it('should successfully release a lock for provided credentials user', () => {
    assert.deepStrictEqual(lockService.releaseLock('ABC', 1, 'OneTime'), {
      lockedBy: {
        XYZ: 1,
      },
      lockedByName: {
        XYZ: 'OneTime'
      }
    });
  });

  it('should successfully keep lock released when user tries to release a lock that is not owned', () => {
    assert.deepStrictEqual(lockService.releaseLock('XYZAGB', 1, 'OneTime'), {
      lockedBy: {
        XYZ: 1,
      },
      lockedByName: {
        XYZ: 'OneTime'
      }
    });
  });

  it('should throw error when a user attempts to release a lock that is held by another user', () => {
    assert.throws(
      () => lockService.releaseLock('XYZ', 0, 'Anonymous'),
      new UnauthorizedAccessError(`Owner for XYZ lock is OneTime (id 1)`)
    );
  });

  it('should successfully release a lock by force from another user', () => {
    assert.deepStrictEqual(lockService.releaseLock('XYZ', 0, 'Anonymous', true), {
      lockedBy: {
      },
      lockedByName: {
      }
    });
  });

});
