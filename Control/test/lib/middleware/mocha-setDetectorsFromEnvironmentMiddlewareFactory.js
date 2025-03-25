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

const {ok, deepStrictEqual} = require('assert');
const sinon = require('sinon');

const { setDetectorsFromEnvironmentMiddlewareFactory } = require('../../../lib/middleware/setDetectorsFromEnvironmentMiddlewareFactory.js');
const { EnvironmentService } = require('./../../../lib/services/Environment.service.js');
const { InvalidInputError } = require('@aliceo2/web-ui');

describe('`setDetectorsFromEnvironmentMiddlewareFactory` middleware test suite', () => {
  it('should successfully call next() and set the list of detecors in req.body', async () => {
    const environmentServiceStub = sinon.createStubInstance(EnvironmentService, {
      getEnvironment: sinon.stub().resolves({includedDetectors: ['abc']})
    });

    const req = {session: {personid: 0, name: 'testUser'}, body: {id: '1231'}};
    const next = sinon.stub().returns();

    await setDetectorsFromEnvironmentMiddlewareFactory(environmentServiceStub)(req, null, next);
    ok(next.calledOnce);
    deepStrictEqual(req.body, {id: '1231', detectors: ['abc']});
  });

  it('should respond with 400 when environment id is empty', async () => {
    const req = {session: {personid: 0, name: 'testUser'}, body: {id: null}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    await setDetectorsFromEnvironmentMiddlewareFactory(null)(req, res);
    ok(res.status.calledWith(400));
    ok(res.json.calledWith({
      message: 'Invalid input: environment id must be provided',
      status: 400,
      title: 'Invalid Input'
      }));
  });

  it('should respond with 400 when body of request is missing', async () => {
    const req = {session: {personid: 0, name: 'testUser'}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns()
    };

    await setDetectorsFromEnvironmentMiddlewareFactory(null)(req, res);
    ok(res.status.calledWith(400));
    ok(res.json.calledWith(
      {
        message: 'Invalid input: environment id must be provided',
        status: 400,
        title: 'Invalid Input'
      }
    ));
  });
});
