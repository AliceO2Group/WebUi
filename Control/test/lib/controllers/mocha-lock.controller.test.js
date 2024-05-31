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
/* eslint-disable max-len */

const assert = require('assert');
const sinon = require('sinon');

const {LockController} = require('./../../../lib/controllers/Lock.controller.js');
const {LockService} = require('./../../../lib/services/Lock.service.js');
const {User} = require('./../../../lib/dtos/User.js');
const {DetectorLockAction} = require('../../../lib/common/lock/detectorLockAction.enum.js');
const {DetectorLockState} = require('../../../lib/common/lock/detectorLockState.enum.js');

describe(`'LockController' test suite`, () => {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  };
  const fakeBroadcastService = {
    broadcast: () => null
  };
  const lockService = new LockService(fakeBroadcastService);
  const lockController = new LockController(lockService);

  describe(`'getLocksStateHandler' test suite`, () => {
    it('should successfully return the state of locks if service is enabled even if no detectors', () => {
      lockController.getLocksStateHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({}));
    });

    it('should successfully return the state of locks if service is enabled and with detectors', () => {
      lockService.setLockStatesForDetectors(['ABC', 'XYZ'])
      lockController.getLocksStateHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
    });
  });

  describe(`'actionLockHandler' test suite`, () => {
    it('should successfully respond to a request to take lock for a specified detector', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.TAKE,
          detectorId: 'ABC',
        }, session: {
          personid: 0,
          name: 'Anonymous',
          username: 'anonymous',
          access: ['global']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.TAKEN,
          owner: {
            personid: 0,
            fullName: 'Anonymous',
            username: 'anonymous',
          }
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
    });

    it('should return error when an already owned lock is requested to be taken by another user', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.TAKE,
          detectorId: 'ABC',
        }, session: {
          personid: 1,
          name: 'NotAnonymous',
          username: 'notanonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.json.calledWith({message: `Unauthorized TAKE action for lock of detector ABC by user NotAnonymous`}));
    });

    it('should reply with error when an already held lock is requested to be released by another user without force', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.RELEASE,
          detectorId: 'ABC',
        }, session: {
          personid: 1,
          name: 'NotAnonymous',
          username: 'notanonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.json.calledWith({message: `Unauthorized RELEASE action for lock of detector ABC by user NotAnonymous`}));
    });

    it('should successfully reply to a request to release lock held by correct owner', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.RELEASE,
          detectorId: 'ABC',
        }, session: {
          personid: 0,
          name: 'Anonymous',
          username: 'anonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
    });

    it('should return InvalidInput error code for invalid request', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.RELEASE,
        }, session: {
          personid: 0,
          name: 'Anonymous',
          username: 'anonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: 'Missing detectorId'}));

      lockController.actionLockHandler({
        params: {
          action: 'RELEASE-FORCE',
          detectorId: 'ABC'
        }, session: {
          personid: 0,
          fullName: 'Anonymous',
          username: 'anonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: 'Invalid action to apply on lock for detector: ABC'}));
    });

    it('should return 404 and not found error message for a detector that does not exist', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.RELEASE,
          detectorId: 'NONEXISTENT'
        }, session: {
          personid: 0,
          fullName: 'Anonymous',
          username: 'anonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(404));
      assert.ok(res.json.calledWith({message: 'Detector NONEXISTENT not found in the list of detectors'}));
    });

    it('should successfully lock all detectors available to lock', () => {
      lockService.takeLock('ABC', new User('anonymous', 'Anonymous', 0, ['global']));
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.TAKE,
          detectorId: 'ALL'
        }, session: {
          personid: 1,
          name: 'OneAnonymous',
          username: 'oneanonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.TAKEN,
          owner: {
            fullName: 'Anonymous',
            personid: 0,
            username: 'anonymous',
          },
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.TAKEN,
          owner: {
            fullName: 'OneAnonymous',
            personid: 1,
            username: 'oneanonymous',
          },
        },
      }));
    });

    it('should successfully release all detectors available to lock', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.RELEASE,
          detectorId: 'ALL'
        }, session: {
          personid: 1,
          name: 'OneAnonymous',
          username: 'oneanonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.TAKEN,
          owner: {
            fullName: 'Anonymous',
            personid: 0,
            username: 'anonymous',
          },
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
    });
  });

  describe(`'actionForceLockHandler' test suite`, () => {
    it('should successfully respond to a request to take lock by force for a specified detector', () => {
      lockController.actionLockHandler({
        params: {
          action: DetectorLockAction.TAKE,
          detectorId: 'ABC',
        }, session: {
          personid: 0,
          username: 'anonymous',
          fullName: 'Anonymous',
          access: ['global']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.TAKEN,
          owner: {
            personid: 0,
            fullName: 'Anonymous',
            username: 'anonymous',
          }
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
      res.status.resetHistory()
      res.json.resetHistory();
      lockController.actionForceLockHandler({
        params: {
          action: DetectorLockAction.TAKE,
          detectorId: 'ABC',
        }, session: {
          personid: 1,
          name: 'NotAnonymous',
          username: 'notanonymous',
          access: ['global']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.TAKEN,
          owner: {
            personid: 1,
            fullName: 'NotAnonymous',
            username: 'notanonymous',
          }
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
    });

    it('should successfully respond to a request to take ALL locks by force', () => {
      lockController.actionForceLockHandler({
        params: {
          action: DetectorLockAction.TAKE,
          detectorId: 'ALL',
        }, session: {
          personid: 22,
          username: 'twotwoanonymous',
          name: 'TwoTwoAnonymous',
          access: ['admin']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.TAKEN,
          owner: {
            personid: 22,
            fullName: 'TwoTwoAnonymous',
            username: 'twotwoanonymous',
          }
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.TAKEN,
          owner: {
            personid: 22,
            fullName: 'TwoTwoAnonymous',
            username: 'twotwoanonymous',
          }
        },
      }));
    });

    it('should successfully respond to a request to release ALL locks by force', () => {
      lockService.takeLock('ABC', new User('anonymous', 'Anonymous', 0, ['global']), true); // now one lock is under personid 0
      lockController.actionForceLockHandler({
        params: {
          action: DetectorLockAction.RELEASE,
          detectorId: 'ALL',
        }, session: {
          personid: 22,
          username: 'twotwoanonymous',
          name: 'TwoTwoAnonymous',
          access: ['admin']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
        XYZ: {
          name: 'XYZ',
          state: DetectorLockState.FREE,
          owner: undefined,
        },
      }));
    });
  });
});
