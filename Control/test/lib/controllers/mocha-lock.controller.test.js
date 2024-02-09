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

const {LockController} = require('../../../lib/controllers/Lock.controller.js');
const {LockService} = require('../../../lib/services/Lock.service.js');
const {LockAction} = require('./../../../lib/common/lock/lockAction.enum.js');

describe(`'LockController' test suite`, async () => {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  };
  const wsStub =  {
    broadcast: () => null
  };
  const lockController = new LockController(
    new LockService(wsStub)
  );

  describe(`'getLocksState' test suite`, async () => {
    it('should successfully return the state of locks if service is enabled', async () => {
      const lockController = new LockController(
        new LockService()
      );
      await lockController.getLocksState({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({lockedBy: {}, lockedByName: {}}));
    });
  });

  describe(`'actionLock' test suite`, async () => {
    it('should successfully reply to a request to take lock for a specified detector', async () => {
      await lockController.actionLock({params: {
        action: LockAction.TAKE,
        detectorId: 'ABC',
      }, session: {
        personid: 0,
        name: 'Anonymous'
      }}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({lockedBy: {ABC: 0}, lockedByName: {ABC: 'Anonymous'}}));
    });
    
    it('should reply with error when an already held lock is requested to be taken by another user', async () => {
      await lockController.actionLock({params: {
        action: LockAction.TAKE,
        detectorId: 'ABC',
      }, session: {
        personid: 1,
        name: 'OneTime'
      }}, res);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.json.calledWith({message: `Lock ABC is already held by Anonymous (id 0)`}));
    });

    it('should reply with error when an already held lock is requested to be released by another user', async () => {
      await lockController.actionLock({params: {
        action: LockAction.RELEASE,
        detectorId: 'ABC',
      }, session: {
        personid: 1,
        name: 'OneTime'
      }}, res);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.json.calledWith({message: `Owner for ABC lock is Anonymous (id 0)`}));
    });

    it('should successfully reply to a request to release lock held by correct owner', async () => {
      await lockController.actionLock({params: {
        action: LockAction.RELEASE,
        detectorId: 'ABC',
      }, session: {
        personid: 0,
        name: 'Anonymous'
      }}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({lockedBy: {}, lockedByName: {}}));
    });

    it('should return InvalidInput error code for invalid request', async () => {
      await lockController.actionLock({params: {
        action: LockAction.RELEASE,
      }, session: {
        personid: 0,
        name: 'Anonymous'
      }}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: 'Missing detectorId'}));

      await lockController.actionLock({params: {
        action: 'RELEASE-FORCE',
        detectorId: 'ABC'
      }, session: {
        personid: 0,
        name: 'Anonymous'
      }}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: 'Invalid action to apply on lock for detector: ABC'}));
    });
  });
});
