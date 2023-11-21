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

const {EnvironmentService} = require('./../../../lib/services/Environment.service.js');
const {NotFoundError} = require('./../../../lib/errors/NotFoundError.js');

describe('EnvironmentService test suite', () => {
  const ENVIRONMENT_NOT_FOUND_ID = '2432ENV404';
  const ENVIRONMENT_VALID = '1234ENV';
  const ENVIRONMENT_ID_FAILED_TO_RETRIEVE = '2432ENV502';

  const GetEnvironmentStub = sinon.stub();
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_NOT_FOUND_ID}).rejects({code: 5, details: `Environment with ID: ${ENVIRONMENT_NOT_FOUND_ID} could not be found`});
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE}).rejects({code: 1, details: `Proxy service failed`});
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_VALID}).resolves({environment: {id: ENVIRONMENT_VALID, description: 'Some description'}});

  const ControlEnvironmentStub = sinon.stub();
  ControlEnvironmentStub.withArgs({id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE, type: 'START_ACTIVITY'}).rejects({code: 5, details: 'Environment not found'});
  ControlEnvironmentStub.withArgs({id: ENVIRONMENT_VALID, type: 'START_ACTIVITY'}).resolves({id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1});

  const envService = new EnvironmentService(
    {
      GetEnvironment: GetEnvironmentStub,
      ControlEnvironment: ControlEnvironmentStub,
    }, {detectors: [], includedDetectors: []}
  );

  describe(`'getEnvironment' test suite`, async () => {
    it('should successfully build a response with environment details given an id', async () => {
      const env = await envService.getEnvironment(ENVIRONMENT_VALID);
      assert.strictEqual(env.id, ENVIRONMENT_VALID);
      assert.strictEqual(env.description, 'Some description');
    });

    it('should reject with error if service for retrieving information failed', async () => {
      await assert.rejects(envService.getEnvironment(ENVIRONMENT_ID_FAILED_TO_RETRIEVE), new Error(`Proxy service failed`));
    });
    it('should reject with NotFoundError if service for retrieving information failed', async () => {
      await assert.rejects(envService.getEnvironment(ENVIRONMENT_NOT_FOUND_ID), new NotFoundError(`Environment with ID: ${ENVIRONMENT_NOT_FOUND_ID} could not be found`));
    });
  });

  describe(`'transitionEnvironment' test suite`, async () => {
    it('should throw gRPC type of error due to issue', async () => {
      await assert.rejects(envService.transitionEnvironment(ENVIRONMENT_ID_FAILED_TO_RETRIEVE, 'START_ACTIVITY'), new NotFoundError('Environment not found'));
    });
    it('should successfully return environment transition results', async () => {
      const environmentTransitioned = await envService.transitionEnvironment(ENVIRONMENT_VALID, 'START_ACTIVITY');
      assert.deepStrictEqual(environmentTransitioned, {id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1})
    });
  });
});
