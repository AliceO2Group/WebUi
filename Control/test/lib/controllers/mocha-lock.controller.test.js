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
          state: 'FREE',
          owner: undefined,
        },
        XYZ:  {
          name: 'XYZ',
          state: 'FREE',
          owner: undefined,
        },
      }));
    });
  });

  describe(`'actionLockHandler' test suite`, () => {
    it('should successfully respond to a request to take lock for a specified detector', () => {
      lockController.actionLockHandler({
        params: {
          action: 'TAKE',
          detectorId: 'ABC',
        }, session: {
          personid: 0,
          name: 'Anonymous',
          access: ['global']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: 'TAKEN',
          owner: {
            personid: 0,
            username: 'Anonymous',
          }
        },
        XYZ:  {
          name: 'XYZ',
          state: 'FREE',
          owner: undefined,
        },
      }));
    });

    it('should return error when an already owned lock is requested to be taken by another user', () => {
      lockController.actionLockHandler({
        params: {
          action: 'TAKE',
          detectorId: 'ABC',
        }, session: {
          personid: 1,
          name: 'NotAnonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.json.calledWith({message: `Unauthorized TAKE action for lock of detector ABC by user NotAnonymous`}));
    });

    it('should reply with error when an already held lock is requested to be released by another user without force', () => {
      lockController.actionLockHandler({
        params: {
          action: 'RELEASE',
          detectorId: 'ABC',
        }, session: {
          personid: 1,
          name: 'NotAnonymous',
        }
      }, res);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.json.calledWith({message: `Unauthorized RELEASE action for lock of detector ABC by user NotAnonymous`}));
    });

    it('should successfully reply to a request to release lock held by correct owner', () => {
      lockController.actionLockHandler({
        params: {
          action: 'RELEASE',
          detectorId: 'ABC',
        }, session: {
          personid: 0,
          name: 'Anonymous'
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: 'FREE',
          owner: undefined,
        },
        XYZ:  {
          name: 'XYZ',
          state: 'FREE',
          owner: undefined,
        },
      }));
    });

    it('should return InvalidInput error code for invalid request', () => {
      lockController.actionLockHandler({
        params: {
          action: 'RELEASE',
        }, session: {
          personid: 0,
          name: 'Anonymous'
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
          name: 'Anonymous'
        }
      }, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: 'Invalid action to apply on lock for detector: ABC'}));
    });
  });

  describe(`'actionForceLockHandler' test suite`, () => {
    it('should successfully respond to a request to take lock by force for a specified detector', () => {
      lockController.actionLockHandler({
        params: {
          action: 'TAKE',
          detectorId: 'ABC',
        }, session: {
          personid: 0,
          name: 'Anonymous',
          access: ['global']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: 'TAKEN',
          owner: {
            personid: 0,
            username: 'Anonymous',
          }
        },
        XYZ:  {
          name: 'XYZ',
          state: 'FREE',
          owner: undefined,
        },
      }));
      res.status.resetHistory()
      res.json.resetHistory();
      lockController.actionForceLockHandler({
        params: {
          action: 'TAKE',
          detectorId: 'ABC',
        }, session: {
          personid: 1,
          name: 'NotAnonymous',
          access: ['global']
        }
      }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        ABC: {
          name: 'ABC',
          state: 'TAKEN',
          owner: {
            personid: 1,
            username: 'NotAnonymous',
          }
        },
        XYZ:  {
          name: 'XYZ',
          state: 'FREE',
          owner: undefined,
        },
      }));
    });
  });
});
