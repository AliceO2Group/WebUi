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
const {lockOwnershipMiddleware} = require('../../../lib/middleware/lockOwnership.middleware');
const {LockService} = require('../../../lib/services/Lock.service.js');
const {EnvironmentService} = require('../../../lib/services/Environment.service.js');

describe('`LockOwnership` middleware test suite', () => {
  it('should successfully call next() when lock for detectors of specified environment are owned', async () => {
    const lockServiceStub = sinon.createStubInstance(LockService, {
      hasLocks: sinon.stub().returns(true)
    });
    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().resolves({includedDetectors: ['abc']})
    });

    const req = {session: {personid: 0, name: 'testUser'}};
    const next = sinon.stub().returns();

    await lockOwnershipMiddleware(lockServiceStub, environmentServiceStub)(req, null, next);
    assert.ok(next.calledOnce);
  });

  it('should respond with 404 when environment id is empty', async () => {
    const req = {session: {personid: 0, name: 'testUser'}, params: {id: null}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().rejects({
        code: 5,
        details: 'Environment not found',
      })
    });

    await lockOwnershipMiddleware(null, environmentServiceStub)(req, res);
    assert.ok(res.status.calledWith(404));
    assert.ok(res.json.calledWith(
      {message: 'Environment not found'}
    ));
  });

  it('should respond with 404 when environment id attribute is missing from params', async () => {
    const req = {session: {personid: 0, name: 'testUser'}, params: {}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().rejects({
        code: 5,
        details: 'Environment not found',
      })
    });

    await lockOwnershipMiddleware(null, environmentServiceStub)(req, res);
    assert.ok(res.status.calledWith(404));
    assert.ok(res.json.calledWith(
      {message: 'Environment not found'}
    ));
  });

  it('should respond with 403 when body of request is missing', async () => {
    const req = {session: {personid: 0, name: 'testUser'}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().rejects({
        code: 4,
        details: 'Operation timeout',
      })
    });

    await lockOwnershipMiddleware(null, environmentServiceStub)(req, res);
    assert.ok(res.status.calledWith(408));
    assert.ok(res.json.calledWith(
      {message: 'Operation timeout'}
    ));
  });

  it('should respond with 403 when user is missing ownership of locks for specified detectors', async() => {
    const req = {
      session: {personid: 0, name: 'testUser'}, params: {id: '1231'}
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const lockServiceStub = sinon.createStubInstance(LockService, {
      hasLocks: sinon.stub().returns(false)
    });
    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().resolves({includedDetectors: ['abc']})
    });

    await lockOwnershipMiddleware(lockServiceStub, environmentServiceStub)(req, res);

    assert.ok(res.status.calledWith(403));
    assert.ok(res.json.calledWith(
      {message: 'Action not allowed for user testUser due to missing ownership of lock(s)'}
    ));
  });
});
