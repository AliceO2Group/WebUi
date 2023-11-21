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

const {EnvironmentController} = require('../../../lib/controllers/Environment.controller.js');
const {NotFoundError} = require('../../../lib/errors/NotFoundError.js');

describe('EnvironmentController test suite', () => {
  const ENVIRONMENT_NOT_FOUND_ID = '2432ENV404';
  const ENVIRONMENT_VALID = '1234ENV';
  const ENVIRONMENT_ID_FAILED_TO_RETRIEVE = '2432ENV502';

  const getEnvironmentStub = sinon.stub();
  getEnvironmentStub.withArgs(ENVIRONMENT_NOT_FOUND_ID).rejects(new NotFoundError(`Environment with ID: ${ENVIRONMENT_NOT_FOUND_ID} could not be found`));
  getEnvironmentStub.withArgs(ENVIRONMENT_ID_FAILED_TO_RETRIEVE).rejects(new Error(`Data service failed`));
  getEnvironmentStub.withArgs(ENVIRONMENT_VALID).resolves({id: ENVIRONMENT_VALID, description: 'Some description'});

  const transitionEnvironmentStub = sinon.stub();
  transitionEnvironmentStub.withArgs(ENVIRONMENT_ID_FAILED_TO_RETRIEVE, 'START_ACTIVITY').rejects(new Error(`Cannot transition environment`));
  transitionEnvironmentStub.withArgs(ENVIRONMENT_VALID, 'START_ACTIVITY').resolves({id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1});

  const envService = {
    getEnvironment: getEnvironmentStub,
    transitionEnvironment: transitionEnvironmentStub
  };
  const envCtrl = new EnvironmentController(envService);
  let res;

  describe(`'getEnvironmentHandler' test suite`, async () => {
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
    });

    it('should successfully build a response with environment details given an id', async () => {
      await envCtrl.getEnvironmentHandler({params: {id: ENVIRONMENT_VALID}}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({id: ENVIRONMENT_VALID, description: 'Some description'}));
    });

    it('should respond with error if provided environment id cannot be found', async () => {
      await envCtrl.getEnvironmentHandler({params: {id: ENVIRONMENT_NOT_FOUND_ID}}, res);
      assert.ok(res.status.calledWith(404));
      assert.ok(res.json.calledWith({message: `Environment with ID: ${ENVIRONMENT_NOT_FOUND_ID} could not be found`}));
    });

    it('should respond with error if service for retrieving information failed', async () => {
      await envCtrl.getEnvironmentHandler({params: {id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE}}, res);
      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({message: `Data service failed`}));
    });

    it('should respond with error if client did not provide valid request for ID', async () => {
      await envCtrl.getEnvironmentHandler({params: {id: null}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: `Missing environment ID parameter`}));

      await envCtrl.getEnvironmentHandler({params: {}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: `Missing environment ID parameter`}));

      await envCtrl.getEnvironmentHandler({params: {id: ''}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: `Missing environment ID parameter`}));
    });
  });

  describe(`'transitionEnvironmentHandler' test suite`, async () => {
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
    });

    it('should return error due to missing id', async () => {
      await envCtrl.transitionEnvironmentHandler({params: {id: null}, body: {type: null}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: `Missing environment ID parameter`}));
    });

    it('should return error due to missing transition type', async () => {
      await envCtrl.transitionEnvironmentHandler({params: {id: 'ABC123'}, body: {type: null}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: `Invalid environment transition to perform`}));
    });

    it('should return error due to invalid transition type', async () => {
      await envCtrl.transitionEnvironmentHandler({params: {id: 'ABC123'}, body: {type: 'NON_EXISTENT'}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({message: `Invalid environment transition to perform`}));
    });

    it('should return error due to transition environment issue', async () => {
      await envCtrl.transitionEnvironmentHandler({params: {id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE}, body: {type: 'START_ACTIVITY'}}, res);
      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({message: `Cannot transition environment`}));
    });

    it('should successfully return environment in transition state', async () => {
      await envCtrl.transitionEnvironmentHandler({params: {id: ENVIRONMENT_VALID}, body: {type: 'START_ACTIVITY'}}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1}));
    });
  });
});
