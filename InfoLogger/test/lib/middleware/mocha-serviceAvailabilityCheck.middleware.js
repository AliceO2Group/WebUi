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
const { serviceAvailabilityCheck } = require('../../../lib/middleware/serviceAvailabilityCheck.middleware');

describe('`Service Availability Check Middleware` test suite', () => {
  it('should successfully call next() from Express service object exists and is available', () => {
    const next = sinon.stub().returns();
    const serviceToCheck = { isAvailable: true };

    serviceAvailabilityCheck(serviceToCheck)(null, null, next);
    assert.ok(next.calledOnce);
  });

  it('should use `res` object to respond with error and status 503 for service unavailable ' +
    'when it is configured but not available', () => {
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    let serviceToCheck = { isAvailable: false };
    serviceAvailabilityCheck(serviceToCheck)(null, res, null);
    assert.ok(res.status.calledWith(503));
    assert.ok(res.json.calledWith({ message: 'Service is not available' }));

    serviceToCheck = { isAvailable: null };
    serviceAvailabilityCheck(serviceToCheck)(null, res, null);
    assert.ok(res.status.calledWith(503));
    assert.ok(res.json.calledWith({ message: 'Service is not available' }));

    serviceToCheck = { };
    serviceAvailabilityCheck(serviceToCheck)(null, res, null);
    assert.ok(res.status.calledWith(503));
    assert.ok(res.json.calledWith({ message: 'Service is not available' }));
  });

  it('should use `res` object to respond with error when service was not configured', () => {
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    let serviceToCheck = null;
    serviceAvailabilityCheck(serviceToCheck)(null, res, null);
    assert.ok(res.status.calledWith(503));
    assert.ok(res.json.calledWith({ message: 'Service is not configured' }));

    serviceToCheck = undefined;
    serviceAvailabilityCheck(serviceToCheck)(null, res, null);
    assert.ok(res.status.calledWith(503));
    assert.ok(res.json.calledWith({ message: 'Service is not configured' }));
  });
});
