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
const { NotFoundError, TimeoutError } = require('@aliceo2/web-ui');

const {verifyEnvironmentLockOwnershipMiddleware} = require('../../../lib/middleware/verifyEnvironmentLockOwnership.middleware.js');
const {LockService} = require('../../../lib/services/Lock.service.js');
const {EnvironmentService} = require('../../../lib/services/Environment.service.js');

describe('`verifyEnvironmentLockOwnership` middleware test suite', () => {
  it('should successfully call next() when lock for detectors of specified environment are owned', async () => {
    const lockServiceStub = sinon.createStubInstance(LockService, {
      hasLocks: sinon.stub().returns(true)
    });
    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().resolves({includedDetectors: ['abc']})
    });

    const req = {session: {personid: 0, name: 'testUser'}};
    const next = sinon.stub().returns();

    await verifyEnvironmentLockOwnershipMiddleware(lockServiceStub, environmentServiceStub)(req, null, next);
    assert.ok(next.calledOnce);
  });

  it('should respond with 404 when environment id is empty', async () => {
    const req = {session: {personid: 0, name: 'testUser'}, params: {id: null}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().rejects(new NotFoundError('Environment not found'))
    });

    await verifyEnvironmentLockOwnershipMiddleware(null, environmentServiceStub)(req, res);
    assert.ok(res.status.calledWith(404));
    assert.ok(res.json.calledWith({
      message: 'Environment not found',
      status: 404,
      title: 'Not Found'
    }
    ));
  });

  it('should respond with 404 when environment id attribute is missing from params', async () => {
    const req = {session: {personid: 0, name: 'testUser'}, params: {}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().rejects(new NotFoundError('Environment not found'))
    });

    await verifyEnvironmentLockOwnershipMiddleware(null, environmentServiceStub)(req, res);
    assert.ok(res.status.calledWith(404));
    assert.ok(res.json.calledWith({
      message: 'Environment not found',
      status: 404,
      title: 'Not Found',
    }
    ));
  });

  it('should respond with 403 when body of request is missing', async () => {
    const req = {session: {personid: 0, name: 'testUser'}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().rejects(new TimeoutError('Operation timeout'))
    });

    await verifyEnvironmentLockOwnershipMiddleware(null, environmentServiceStub)(req, res);
    assert.ok(res.status.calledWith(408));
    assert.ok(res.json.calledWith(
      {
        message: 'Operation timeout',
        status: 408,
        title: 'Timeout'
      }
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

    await verifyEnvironmentLockOwnershipMiddleware(lockServiceStub, environmentServiceStub)(req, res);

    assert.ok(res.status.calledWith(403));
    assert.ok(res.json.calledWith(
      {message: 'Action not allowed for user testUser due to missing ownership of lock(s)'}
    ));
  });
});
