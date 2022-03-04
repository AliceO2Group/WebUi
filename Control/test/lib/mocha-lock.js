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
const sinon = require('sinon');
const Lock = require('../../lib/services/Lock.js');

describe('Lock test suite', () => {
  let req, res, fakeWs, lock;
  beforeEach(() => {
    fakeWs = {
      broadcast: () => null
    }
    req = {
      body: {
        name: 'test'
      },  
      session: {
        name: 'Test',
        personid: 1,
        access: ['admin']
      }
    }; 
    res = { 
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
      send: sinon.spy(),
    };
    lock = new Lock();
    lock.setWs(fakeWs);
  });

  it('Should set fake WS instance', () => {
    assert.deepStrictEqual(lock.state(), {lockedBy: {}, lockedByName: {}});
  });

  it('Should fail to take empty lock if entity is not specified', () => {
    delete req.body.name;
    lock.lockDetector(req, res);
    assert.ok(res.status.calledOnce);
    assert.ok(res.status.calledWith(403));
  });

  it('Should take empty lock', () => {
    lock.lockDetector(req, res);
    assert.deepStrictEqual(lock.state(), {lockedBy: {test: 1}, lockedByName: {test: 'Test'}});
  });

  it('Should lock and unlock', () => {
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(200));
    lock.unlockDetector(req, res);
    assert.ok(res.status.calledWith(200));
    assert.deepStrictEqual(lock.state(), {lockedBy: {}, lockedByName: {}});
  });

  it('Should fail to release empty lock', () => {
    lock.unlockDetector(req, res);
     assert.ok(res.status.calledWith(403));
  });

  it('Should fail to lock once again by same user', () => {
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(200));
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(403));
  });

  it('Should fail to lock if another user holds the lock', () => {
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(200));
    req.session.personid = 2;
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(403));
  });

  it('Should force lock occupied lock if user has admin rights', () => {
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(200));
    lock.forceUnlock(req, res);
    assert.ok(res.status.calledWith(200));
    assert.deepStrictEqual(lock.state(), {lockedBy: {}, lockedByName: {}});
  }); 

  it('Should fail to force lock occupied lock if user has no admin rights', () => {
    req.session.access = [];
    lock.lockDetector(req, res);
    assert.ok(res.status.calledWith(200));
    lock.forceUnlock(req, res);
    assert.ok(res.status.calledWith(403));
    assert.deepStrictEqual(lock.state(), {lockedBy: {test: 1}, lockedByName: {test: 'Test'}});
  }); 
});
