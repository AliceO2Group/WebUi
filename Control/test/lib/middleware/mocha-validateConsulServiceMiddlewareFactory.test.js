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
const { validateConsulServiceMiddlewareFactory } = require('../../../lib/middleware/validateConsulServiceMiddlewareFactory.js');

describe('`validateConsulServiceMiddlewareFactory` test suite', () => {
  let consulService, reqMock, resMock, nextMock;

  beforeEach(() => {
    consulService = {};
    
    reqMock = {};
    
    resMock = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    
    nextMock = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call next() consulService is ok', async () => {
    await validateConsulServiceMiddlewareFactory(consulService)(reqMock, resMock, nextMock);

    assert.ok(nextMock.calledOnce);
    assert.ok(resMock.status.notCalled);
    assert.ok(resMock.json.notCalled);
  });

  it('should return 502 if there consulService is not available', async () => {
    consulService = null;
    await validateConsulServiceMiddlewareFactory(consulService)(reqMock, resMock, nextMock);

    assert.ok(resMock.status.calledOnceWith(502));
    assert.ok(resMock.json.calledOnceWith({
      message: 'Unable to retrieve configuration of consul service',
    }));
    assert.ok(nextMock.notCalled);
  });
});
