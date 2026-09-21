/**
 * @license
 * Copyright 2019-2024 CERN and copyright holders of ALICE O2.
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

const { requireDetectorOrGlobalRoleMiddleware } = require('../../../lib/middleware/requireDetectorOrGlobalRole.middleware.js');

describe('requireDetectorOrGlobalRoleMiddleware - test suite', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('should respond with error if detectorId is missing from parameter', function () {
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.spy();
    requireDetectorOrGlobalRoleMiddleware({}, res, next);
    assert.ok(res.status.calledOnce);
    assert.ok(res.status.calledWith(400));
    assert.ok(res.json.calledWith({message: 'Invalid request: missing detectorId parameter', status: 400, title: 'Invalid Input'}));
    assert.ok(res.json.calledOnce);
    assert.ok(next.notCalled);
  });

  it('should call next if user has GLOBAL or ADMIN role', function () {
    let req = {
      params: { detectorId: 'ABC' },
      session: {
        name: 'Test User',
        username: 'test',
        personid: 1,
        access: 'global'
      }
    }
    let res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    let next = sinon.spy();

    requireDetectorOrGlobalRoleMiddleware(req, res, next);
    assert.ok(next.calledOnce, 'Next should be called when user has GLOBAL role');

    req = {
      params: { detectorId: 'ABC' },
      session: {
        name: 'Test User',
        username: 'test',
        personid: 1,
        access: 'admin,another-role'
      }
    }
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.spy();

    requireDetectorOrGlobalRoleMiddleware(req, res, next);
    assert.ok(next.calledOnce, 'Next should be called when user has ADMIN role');
  });

  it('should call next if user has role for the detector', function () {
    const req = {
      params: { detectorId: 'ABC' },
      session: {
        name: 'Test User',
        username: 'test',
        personid: 1,
        access: 'det-ABC,another-role'
      }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.spy();
    requireDetectorOrGlobalRoleMiddleware(req, res, next);
    assert.ok(next.calledOnce);
  });

 it('should respond with error if user does not have role for the detector', function () {
    const req = {
      params: { detectorId: 'XYZ' },
      session: {
        name: 'Test User',
        username: 'test',
        personid: 1,
        access: 'det-ABC,another-role'
      }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.spy();
    requireDetectorOrGlobalRoleMiddleware(req, res, next);
    assert.ok(next.notCalled, 'Next should not be called when user does not have role for the detector');
    assert.ok(res.status.calledOnce, 'Response status should be called once');
    assert.ok(res.status.calledWith(403), 'Response status should be 403 Forbidden');
    assert.ok(res.json.calledOnce, 'Response JSON should be called once');
    assert.ok(res.json.calledWith({
      message: 'User "Test User" is not part of role for detector "XYZ"',
      status: 403,
      title: 'Unauthorized Access'
    }), 'Response JSON should contain the correct error message');
  });

});
