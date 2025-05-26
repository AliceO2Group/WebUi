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

const {ok} = require('assert');
const sinon = require('sinon');
const {TimeoutError} = require('@aliceo2/web-ui');
const {verifyDetectorsAvailabilityMiddlewareFactory} = require('../../../lib/middleware/verifyDetectorsAvailabilityMiddlewareFactory.middleware.js');

describe('`verifyDetectorsAvailabilityMiddlewareFactory` - test suite', () => {
  let detectorServiceMock;
  let req;
  let res;
  let next;

  beforeEach(() => {
    detectorServiceMock = {
      areDetectorsAvailable: sinon.stub(),
    };
    req = { body: { detectors: ['TPC', 'ITS'] } };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.stub();
  });

  it('should call next() if all requested detectors are available', async () => {
    detectorServiceMock.areDetectorsAvailable.resolves(true);

    const verifyMiddleware = verifyDetectorsAvailabilityMiddlewareFactory(detectorServiceMock);
    await verifyMiddleware(req, res, next);

    ok(detectorServiceMock.areDetectorsAvailable.calledOnceWith(['TPC', 'ITS']));
    ok(next.calledOnce);
    ok(res.status.notCalled);
    ok(res.json.notCalled);
  });

  it('should use response object to return a ServiceUnavailableError if detectors are not available', async () => {
    detectorServiceMock.areDetectorsAvailable.resolves(false);

    const middleware = verifyDetectorsAvailabilityMiddlewareFactory(detectorServiceMock);
    await middleware(req, res, next);

    ok(detectorServiceMock.areDetectorsAvailable.calledOnceWith(['TPC', 'ITS']));
    ok(next.notCalled);
    ok(res.status.calledOnceWith(503));
    ok(res.json.calledOnce);
  });

  it(`should successfully handle errors thrown by 'detectorService.areDetectorsAvailable'`, async () => {
    const error = new TimeoutError('Unexpected error when trying to check detectors availability');
    detectorServiceMock.areDetectorsAvailable.rejects(error);

    const middleware = verifyDetectorsAvailabilityMiddlewareFactory(detectorServiceMock);
    await middleware(req, res, next);

    ok(detectorServiceMock.areDetectorsAvailable.calledOnceWith(['TPC', 'ITS']));
    ok(next.notCalled);
    ok(res.status.calledOnceWith(408));
    ok(res.json.calledOnce);
  });
});
