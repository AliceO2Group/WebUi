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
const { NotFoundError, GrpcErrorCodes, UnauthorizedAccessError, InvalidInputError } = require('@aliceo2/web-ui');

const { EnvironmentService } = require('./../../../lib/services/Environment.service.js');
const { User } = require('./../../../lib/dtos/User.js');

describe('EnvironmentService test suite', () => {
  const user = new User('unknown', 'unknown', 0);
  const ENVIRONMENT_NOT_FOUND_ID = '2432ENV404';
  const ENVIRONMENT_NOT_FOUND_ID_BUT_CALL_SUCCESS = '2432ENV404SUCCESS';
  const ENVIRONMENT_VALID = '1234ENV';
  const ENVIRONMENT_ID_FAILED_TO_RETRIEVE = '2432ENV502';

  const GetEnvironmentsStub = sinon.stub();

  const GetEnvironmentStub = sinon.stub();
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_NOT_FOUND_ID_BUT_CALL_SUCCESS}).resolves({});
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_NOT_FOUND_ID}).rejects({code: 5, details: `Environment with ID: ${ENVIRONMENT_NOT_FOUND_ID} could not be found`});
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE}).rejects({code: 1, details: `Proxy service failed`});
  GetEnvironmentStub.withArgs({id: ENVIRONMENT_VALID}).resolves({environment: {id: ENVIRONMENT_VALID, description: 'Some description'}});

  const ControlEnvironmentStub = sinon.stub();
  ControlEnvironmentStub.withArgs({id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE, type: 'START_ACTIVITY', requestUser: { name: 'unknown', externalId: 0 }}).rejects({code: 5, details: 'Environment not found'});
  ControlEnvironmentStub.withArgs({id: ENVIRONMENT_VALID, type: 'START_ACTIVITY', requestUser: { name: 'unknown', externalId: 0 }}).resolves({id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1});

  const DestroyEnvironmentStub = sinon.stub();
  DestroyEnvironmentStub.withArgs({
    id: ENVIRONMENT_ID_FAILED_TO_RETRIEVE,
    keepTasks: false,
    allowInRunningState: false,
    force: false,
    requestUser: {
      name: 'unknown',
      externalId: 0
    }
  }).rejects({ code: 5, details: 'Environment not found' });
  DestroyEnvironmentStub.withArgs({
    id: ENVIRONMENT_VALID,
    keepTasks: true,
    allowInRunningState: false,
    force: false,
    requestUser: {
      name: 'unknown',
      externalId: 0
    }
  }).resolves({ id: ENVIRONMENT_VALID });
  DestroyEnvironmentStub.rejects({code: 1, details: 'Wrong arguments, using default stub reject'});

  const NewEnvironmentAsyncStub = sinon.stub();
  NewEnvironmentAsyncStub.withArgs(
    { workflowTemplate: 'BAD', vars: undefined, autoTransition: false, requestUser: user.toEcsFormat() }
  ).rejects({ code: 3, details: 'Cannot create environment with this template' });
  NewEnvironmentAsyncStub.withArgs(
    { workflowTemplate: 'MISSING_ID_CASE', vars: undefined, autoTransition: false, requestUser: user.toEcsFormat() }
  ).resolves({ id: undefined, state: 'RUNNING', currentRunNumber: 1 });
  NewEnvironmentAsyncStub.withArgs(
    { workflowTemplate: 'github/template/1.1.0', vars: {keyA: 'keyA'}, autoTransition: false, requestUser: user.toEcsFormat() }
  ).resolves({ environment: { id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1 } });

  const environmentCacheServiceMock = {
    environments: new Map(),
  };
  const envService = new EnvironmentService(
    {
      GetEnvironments: GetEnvironmentsStub,
      GetEnvironment: GetEnvironmentStub,
      ControlEnvironment: ControlEnvironmentStub,
      DestroyEnvironment: DestroyEnvironmentStub,
      NewEnvironmentAsync: NewEnvironmentAsyncStub,
    }, { detectors: [], includedDetectors: [] }, {}, {}, environmentCacheServiceMock,
  );

  describe(`'getEnvironments' test suite`, async () => {
    it('should handle errors and throw a native error when gRPC call fails', async () => {
      const grpcError = { code: GrpcErrorCodes.UNAUTHORIZED_ACCESS, details: 'No access' };
      GetEnvironmentsStub.rejects(grpcError);
      await assert.rejects(
        () => envService.getEnvironments(false, false),
        new UnauthorizedAccessError('No access')
      );
    });
  
    it('should handle empty environments list gracefully', async () => {
      GetEnvironmentsStub.resolves({ environments: [] });
  
      envService._broadcastService = {
        broadcast: sinon.stub(),
      }
      const result = await envService.getEnvironments(false, false);
      assert.strictEqual(result.length, 0);
      assert.strictEqual(environmentCacheServiceMock.environments.size, 0); // Cache should not be updated
      assert.ok(envService._broadcastService.broadcast.calledWith('ENVIRONMENTS_OVERVIEW', []));
    });

    it('should retrieve environments and return them without updating the cache', async () => {
      const mockEnvironments = [
        { id: 'env1', state: 'active' },
        { id: 'env2', state: 'inactive' },
      ];
      GetEnvironmentsStub.resolves({ environments: mockEnvironments });
      GetEnvironmentStub.withArgs({ id: mockEnvironments[0].id }).resolves({ environment: mockEnvironments[0] });
      GetEnvironmentStub.withArgs({ id: mockEnvironments[1].id }).resolves({ environment: mockEnvironments[1] });
      
      const result = await envService.getEnvironments(false, false);
  
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, 'env1');
      assert.strictEqual(result[1].id, 'env2');
      assert.strictEqual(environmentCacheServiceMock.environments.size, 0); // Cache should not be updated
    });

    it('should retrieve environments and update the cache when `shouldUpdateCache` is true', async () => {
      const mockEnvironments = [
        { id: 'env1', state: 'active' },
        { id: 'env2', state: 'inactive' },
      ];
      GetEnvironmentsStub.resolves({ environments: mockEnvironments });
      GetEnvironmentStub.withArgs({ id: mockEnvironments[0].id }).resolves({ environment: mockEnvironments[0] });
      GetEnvironmentStub.withArgs({ id: mockEnvironments[1].id }).resolves({ environment: mockEnvironments[1] });
      
      envService._environmentCacheService.addOrUpdateEnvironment = sinon.stub().returns();
      const result = await envService.getEnvironments(false, true);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, 'env1');
      assert.strictEqual(result[1].id, 'env2');
      assert.ok(envService._environmentCacheService.addOrUpdateEnvironment.calledTwice);
    });
  });

  describe(`'getEnvironment' test suite`, async () => {
    it('should successfully return an environment given an id', async () => {
      envService._environmentCacheService.environments = new Map();
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

    it('should reject with NotFoundError if service replied to the call but with empty payload', async () => {
      await assert.rejects(envService.getEnvironment(ENVIRONMENT_NOT_FOUND_ID_BUT_CALL_SUCCESS), new NotFoundError(`Environment (id: ${ENVIRONMENT_NOT_FOUND_ID_BUT_CALL_SUCCESS}) not found`));
    });
  });

  describe(`'transitionEnvironment' test suite`, async () => {
    it('should throw gRPC type of error due to issue', async () => {
      await assert.rejects(envService.transitionEnvironment(ENVIRONMENT_ID_FAILED_TO_RETRIEVE, 'START_ACTIVITY', user), new NotFoundError('Environment not found'));
    });

    it('should successfully return environment transition results', async () => {
      const environmentTransitioned = await envService.transitionEnvironment(ENVIRONMENT_VALID, 'START_ACTIVITY', user);
      assert.deepStrictEqual(environmentTransitioned, {id: ENVIRONMENT_VALID, state: 'RUNNING', currentRunNumber: 1})
    });
  });

  describe(`'destroyEnvironment' test suite`, async () => {
    it('should throw gRPC type of error due to issue encountered when trying to destroy environment and have default values set', async () => {
      await assert.rejects(envService.destroyEnvironment(ENVIRONMENT_ID_FAILED_TO_RETRIEVE, {}, user), new NotFoundError('Environment not found'));
    });

    it('should successfully return environment id if successfully destroyed', async () => {
      const environmentTransitioned = await envService.destroyEnvironment(ENVIRONMENT_VALID, { keepTasks: true }, user);
      assert.deepStrictEqual(environmentTransitioned, {id: ENVIRONMENT_VALID})
    });
  });

  describe(`'newEnvironmentAsync' test suite`, async () => {
    it('should catch gRPC error and throw native error due to issue encountered when trying to create environment', async () => {
      await assert.rejects(
        envService.newEnvironmentAsync({ workflowTemplate: 'BAD', user }, ),
        new InvalidInputError('Cannot create environment with this template')
      );
    });

    it('should throw error due to issue encountered during conversion to environment info of response', async () => {
      await assert.rejects(
        envService.newEnvironmentAsync({ workflowTemplate: 'MISSING_ID_CASE', user }),
        new InvalidInputError(`Unable to process payload from NewEnvironmentAsync response from ECS TypeError: Cannot destructure property 'id' of 'environment' as it is undefined.`)
      );
    });

    it('should successfully return environment id if successfully created', async () => {
      const environmentTransitioned = await envService.newEnvironmentAsync({ workflowTemplate: 'github/template/1.1.0', userVars: {keyA: 'keyA'}, user });
      assert.strictEqual(environmentTransitioned.id, ENVIRONMENT_VALID);
      assert.strictEqual(environmentTransitioned.currentTransition, 'DEPLOY');
    });

    it('should add environment to cache when successfully deployed', async () => {
      envService._environmentCacheService.addOrUpdateEnvironment = sinon.stub().returns();
      const environmentTransitioned = await envService.newEnvironmentAsync({ workflowTemplate: 'github/template/1.1.0', userVars: { keyA: 'keyA' }, user });
      assert.strictEqual(environmentTransitioned.id, ENVIRONMENT_VALID);
      assert.ok(envService._environmentCacheService.addOrUpdateEnvironment.calledOnce);
    })
  });
});
