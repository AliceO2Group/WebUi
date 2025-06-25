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
const { LogManager } = require('@aliceo2/web-ui');
const { getDetectorsLockOwnershipMiddlewareFactory } = require('../../../lib/middleware/getDetectorsLockOwnershipMiddlewareFactory.js');

describe('`getDetectorsLockOwnershipMiddlewareFactory` test suite', () => {
  let lockServiceMock, reqMock, resMock, nextMock, loggerMock;

  beforeEach(() => {
    lockServiceMock = {
      hasLocks: sinon.stub(),
    };

    reqMock = {
      session: {
        name: 'Test User',
        username: 'testuser',
        personid: '12345',
        access: 'admin',
      },
      body: {
        detectors: ['ITS', 'TPC'],
      },
    };

    resMock = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    nextMock = sinon.stub();

    loggerMock = {
      errorMessage: sinon.stub(),
    };

    sinon.stub(LogManager, 'getLogger').returns(loggerMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call next() if the user has ownership of the locks for the requested detectors', async () => {
    lockServiceMock.hasLocks.resolves(true);

    await getDetectorsLockOwnershipMiddlewareFactory(lockServiceMock)(reqMock, resMock, nextMock);

    assert.ok(nextMock.calledOnce);
    assert.ok(resMock.status.notCalled);
    assert.ok(resMock.json.notCalled);
  });

  it('should call next() if the environment in request does not have detectors attribute (e.g. qc workflow)', async () => {
    lockServiceMock.hasLocks.resolves(true);
    detectorlessReqMock = {
      session: {
        name: 'Test User',
        username: 'testuser',
        personid: '12345',
        access: 'admin',
      },
      body: {
      },
    };

    await getDetectorsLockOwnershipMiddlewareFactory(lockServiceMock)(detectorlessReqMock, resMock, nextMock);

    assert.ok(nextMock.calledOnce);
    assert.ok(resMock.status.notCalled);
    assert.ok(resMock.json.notCalled);
  });

  it('should call next() if the environment in request has empty detectors list (e.g. qc workflow)', async () => {
    lockServiceMock.hasLocks.resolves(true);
    detectorlessReqMock = {
      session: {
        name: 'Test User',
        username: 'testuser',
        personid: '12345',
        access: 'admin',
      },
      body: {
        detectors: [],
      },
    };

    await getDetectorsLockOwnershipMiddlewareFactory(lockServiceMock)(detectorlessReqMock, resMock, nextMock);

    assert.ok(nextMock.calledOnce);
    assert.ok(resMock.status.notCalled);
    assert.ok(resMock.json.notCalled);
  });

  it('should return 403 if the user does not have ownership of the locks', async () => {
    lockServiceMock.hasLocks.returns(false);

    await getDetectorsLockOwnershipMiddlewareFactory(lockServiceMock)(reqMock, resMock, nextMock);

    assert.ok(resMock.status.calledOnceWith(403));
    assert.ok(resMock.json.calledOnceWith({
      message: 'Action not allowed for user Test User due to missing ownership of lock(s)',
    }));
    assert.ok(nextMock.notCalled);
  });

  it('should handle native error, use response object and log the error', async () => {
    const error = new Error('Service Unavailable error');
    lockServiceMock.hasLocks.throws(error);

    await getDetectorsLockOwnershipMiddlewareFactory(lockServiceMock)(reqMock, resMock, nextMock);

    assert.ok(loggerMock.errorMessage.calledOnceWith(error));
    assert.ok(nextMock.notCalled);
    assert.ok(resMock.status.calledWith(500));
    assert.ok(resMock.json.calledWith({
      message: 'Service Unavailable error',
      status: 500,
      title: 'Unknown Error',
    }));
  });
});
