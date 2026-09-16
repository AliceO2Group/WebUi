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
const EventEmitter = require('events');
const { EnvironmentCacheService } = require('../../../../lib/services/environment/EnvironmentCache.service.js');
const { EmitterKeys: {
  ENVIRONMENTS_TRACK, INTEGRATED_SERVICES_TRACK: { ODC }, TASKS_TRACK,
}, 
EmitterKeys} = require('../../../../lib/common/emitterKeys.enum.js');
const { BroadcastKeys: {ENVIRONMENT_EVENTS, ENVIRONMENTS_OVERVIEW} } = require('../../../../lib/common/broadcastKeys.enum.js');
const { EnvironmentState } = require('../../../../lib/common/environmentState.enum.js');
const { EnvironmentTransitionType } = require('../../../../lib/common/environmentTransitionType.enum.js');
const { EcsOperationAndStepStatus } = require('../../../../lib/common/ecsOperationAndStepStatus.enum.js');

describe(`'EnvironmentCacheService' - test suite`, () => {
  let broadcastServiceMock;
  let eventEmitter;
  let environmentCacheService;

  beforeEach(() => {
    broadcastServiceMock = {
      broadcast: sinon.stub(),
    };

    eventEmitter = new EventEmitter();
    environmentCacheService = new EnvironmentCacheService(broadcastServiceMock, eventEmitter);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('`addOrUpdateEnvironment` method', () => {
    it('should successfully add new environment and update to the cache', () => {
      const environments = [
        { id: 'abc123', state: 'active' },
      ];

      environmentCacheService.addOrUpdateEnvironment(environments[0], true);

      assert.strictEqual(environmentCacheService._environments.size, 1);
      assert.deepStrictEqual(environmentCacheService._environments.get('abc123'), {
        id: 'abc123',
        state: 'active',
        events: [],
      });
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 1);

      const updatedEnvironments = { id: 'abc123', state: 'inactive' };

      environmentCacheService.addOrUpdateEnvironment(updatedEnvironments, false);

      assert.strictEqual(environmentCacheService._environments.size, 1);
      assert.deepStrictEqual(environmentCacheService._environments.get('abc123'), {
        id: 'abc123',
        isDeploying: undefined,
        deploymentError: undefined,
        state: 'inactive',
        events: [],
        firstTaskInError: undefined,
      });
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 1);
    });

    it('should handle an empty array of environments gracefully', () => {
      environmentCacheService.environments = [];

      assert.strictEqual(environmentCacheService._environments.size, 0);
    });

    it('should update the `_lastUpdate` timestamp when environments are set', () => {
      const environment = { id: 'abc123', state: 'active' };
      const beforeUpdate = Date.now();

      environmentCacheService.addOrUpdateEnvironment(environment);

      assert.ok(environmentCacheService._lastUpdate >= beforeUpdate);
    });

    it('should preserve the `firstTaskInError` field when updating an existing environment', () => {
      const firstTaskInError = {
        environmentId: 'env123',
        state: 'ERROR',
        taskid: 1,
        name: 'task1',
        hostname: 'host1',
        className: 'class1',
        isCritical: false,
      };

      const initialEnvironment = {
        id: 'env123',
        state: 'RUNNING',
        firstTaskInError: firstTaskInError,
      };

      environmentCacheService.addOrUpdateEnvironment(initialEnvironment);

      assert.strictEqual(environmentCacheService._environments.size, 1);
      assert.deepStrictEqual(
        environmentCacheService._environments.get('env123').firstTaskInError,
        firstTaskInError
      );

      const updatedEnvironment = {
        id: 'env123',
        state: 'CONFIGURED',
        someOtherField: 'newValue',
      };

      environmentCacheService.addOrUpdateEnvironment(updatedEnvironment);

      assert.strictEqual(environmentCacheService._environments.size, 1);
      const cachedEnv = environmentCacheService._environments.get('env123');
      assert.strictEqual(cachedEnv.state, 'CONFIGURED');
      assert.strictEqual(cachedEnv.someOtherField, 'newValue');
      assert.deepStrictEqual(cachedEnv.firstTaskInError, firstTaskInError, 
        'firstTaskInError should be preserved after update');
    });
  });

  describe('`get environments` method', () => {
    it('should return the current environments in the cache', () => {
      const environments = [
        { id: 'abc123', state: 'active' },
        { id: 'abc267', state: 'inactive' },
      ];
      environments.forEach((env) => environmentCacheService.addOrUpdateEnvironment(env));

      const cachedEnvironments = environmentCacheService.environments;
      assert.strictEqual(cachedEnvironments.size, 2);
      assert.deepStrictEqual(cachedEnvironments.get('abc123'), {
        id: 'abc123',
        state: 'active',
        events: [],
      });
      assert.deepStrictEqual(cachedEnvironments.get('abc267'), {
        id: 'abc267',
        state: 'inactive',
        events: [],
      });
    });

    it('should return an empty map if no environments are set', () => {
      const cachedEnvironments = environmentCacheService.environments;

      assert.strictEqual(cachedEnvironments.size, 0);
    });
  });

  describe('`removeEnvironmentById` tests', () => {
    it('should remove an environment by id and broadcast if shouldBroadcast is true', () => {
      const env = { id: 'env1', state: 'active', deploymentError: 'Error'};
      environmentCacheService.addOrUpdateEnvironment(env);
      const beforeUpdate = environmentCacheService._lastUpdate;
      environmentCacheService.removeEnvironmentById('env1', true);
      assert.strictEqual(environmentCacheService._environments.has('env1'), false);
      assert.strictEqual(broadcastServiceMock.broadcast.calledOnce, true);
      assert.strictEqual(broadcastServiceMock.broadcast.firstCall.args[0], ENVIRONMENTS_OVERVIEW);
      assert.deepStrictEqual(broadcastServiceMock.broadcast.firstCall.args[1], []);
      assert.ok(environmentCacheService._lastUpdate >= beforeUpdate);
    });

    it('should remove an environment by id and not broadcast if shouldBroadcast is false', () => {
      const env = { id: 'env2', state: 'inactive' };
      environmentCacheService.addOrUpdateEnvironment(env);
      broadcastServiceMock.broadcast.resetHistory();
      environmentCacheService.removeEnvironmentById('env2', false);
      assert.strictEqual(environmentCacheService._environments.has('env2'), false);
      assert.strictEqual(broadcastServiceMock.broadcast.called, false);
    });

    it('should do nothing if id does not exist', () => {
      broadcastServiceMock.broadcast.resetHistory();
      const beforeUpdate = environmentCacheService._lastUpdate;
      environmentCacheService.removeEnvironmentById('nonexistent', true);
      assert.strictEqual(broadcastServiceMock.broadcast.called, false);
      assert.strictEqual(environmentCacheService._environments.size, 0);
      assert.strictEqual(environmentCacheService._lastUpdate, beforeUpdate);
    });
  });

  it('should initialize class with an empty environment cache map', () => {
    assert.strictEqual(environmentCacheService._environments.size, 0);
  });

  it('should add a new environment to the cache and broadcast it when receiving first event', () => {
    const environmentEvent = { id: 'abc123', timestamp: Date.now() };

    eventEmitter.emit(ENVIRONMENTS_TRACK, environmentEvent);

    assert.ok(environmentCacheService._environments.has('abc123'));
    assert.strictEqual(environmentCacheService._environments.get('abc123').lastUpdate, environmentEvent.timestamp);
    assert.ok(broadcastServiceMock.broadcast.calledOnce);
    assert.ok(broadcastServiceMock.broadcast.calledWith(ENVIRONMENT_EVENTS, sinon.match.object));
  });

  it('should update an existing environment in the cache and broadcast it', () => {
    const initialEvent = { id: 'abc135', timestamp: Date.now() - 1000 };
    const updatedEvent = { id: 'abc135', timestamp: Date.now() };

    // Emit initial event
    eventEmitter.emit(ENVIRONMENTS_TRACK, initialEvent);
    assert.ok(environmentCacheService._environments.has('abc135'));
    assert.strictEqual(environmentCacheService._environments.get('abc135').lastUpdate, initialEvent.timestamp);
    assert.strictEqual(broadcastServiceMock.broadcast.callCount, 1);

    // Emit updated event
    eventEmitter.emit(ENVIRONMENTS_TRACK, updatedEvent);

    assert.ok(environmentCacheService._environments.has('abc135'));
    assert.strictEqual(environmentCacheService._environments.get('abc135').lastUpdate, updatedEvent.timestamp);
    assert.strictEqual(broadcastServiceMock.broadcast.callCount, 2);
  });

  describe('`_updateAttributeOfEnvironment` test suite', () => {
    it('should successfully update a nested attribute in an existing environment', () => {
      const environmentId = 'env1';
      environmentCacheService.addOrUpdateEnvironment({
        id: environmentId,
        hardware: {
          epn: {
            info: {
              state: 'INITIAL',
              ddsSessionId: '123',
              ddsSessionStatus: 'ACTIVE',
            },
          },
        },
      });
      environmentCacheService._updateAttributeOfEnvironment(
        environmentId,
        'hardware.epn.info.state',
        'UPDATED'
      );
  
      const updatedEnvironment = environmentCacheService._environments.get(environmentId);
      assert.strictEqual(updatedEnvironment.hardware.epn.info.state, 'UPDATED');
    });
  
    it('should log a warning if the environment ID does not exist in the cache', () => {
      const loggerStub = sinon.stub(environmentCacheService._logger, 'warnMessage');
      const nonExistentEnvironmentId = 'non-existent-env';
  
      environmentCacheService._updateAttributeOfEnvironment(
        nonExistentEnvironmentId,
        'hardware.epn.info.state',
        'UPDATED'
      );
  
      assert.ok(loggerStub.calledOnce);
      assert.ok(
        loggerStub.calledWith(`Environment with id ${nonExistentEnvironmentId} not found in cache.`)
      );
  
      loggerStub.restore();
    });
  });

  describe('Test the listener on track `INTEGRATED_SERVICES_TRACK.ODC.ENVIRONMENT_STATE_CHANGE`', () => {
    it('should update the environment and broadcast the updated environment', () => {
      const environmentId = 'env1';
      const payload = {
        state: 'UPDATED_STATE',
        ddsSessionId: '12345',
        ddsSessionStatus: 'ACTIVE',
      };
      const event = { payload, environmentId };
  
      const initialEnvironment = {
        id: environmentId,
        hardware: {
          epn: {
            info: {
              state: 'INITIAL_STATE',
              ddsSessionId: '67890',
              ddsSessionStatus: 'INACTIVE',
            },
          },
        },
      };
  
      environmentCacheService.addOrUpdateEnvironment(initialEnvironment);
      eventEmitter.emit(ODC.ENVIRONMENT_STATE_CHANGE, event);
  
      const updatedEnvironment = environmentCacheService._environments.get(environmentId);
      assert.strictEqual(updatedEnvironment.hardware.epn.info.state, 'UPDATED_STATE');
      assert.strictEqual(updatedEnvironment.hardware.epn.info.ddsSessionId, '12345');
      assert.strictEqual(updatedEnvironment.hardware.epn.info.ddsSessionStatus, 'ACTIVE');
      assert.ok(broadcastServiceMock.broadcast.calledWith(ENVIRONMENTS_OVERVIEW, [updatedEnvironment]));
    });
  
    it('should log a warning if the environment ID does not exist in the cache', () => {
      const loggerStub = sinon.stub(environmentCacheService._logger, 'warnMessage');
      const environmentId = 'non-existent-env-again';
      const payload = {
        state: 'UPDATED_STATE',
        ddsSessionId: '12345',
        ddsSessionStatus: 'ACTIVE',
      };
      const event = { payload, environmentId };
  
      eventEmitter.emit(ODC.ENVIRONMENT_STATE_CHANGE, event);
      assert.ok(loggerStub.calledOnce);
      assert.ok(
        loggerStub.calledWith(`Environment with id ${environmentId} not found in cache.`)
      );
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 0);
  
      loggerStub.restore();
    });
  });

  describe('Test the listener on track `ENVIRONMENTS_TRACK`', () => {
    it('should NOT update the environment with first error event when it received a task that is not in ERROR/ERROR_CRITICAL', () => {
      const initialEnvironment = {
        id: 'env1',
        hardware: {
          epn: {
            info: {
              state: 'INITIAL_STATE',
              ddsSessionId: '67890',
              ddsSessionStatus: 'INACTIVE',
            },
          },
        },
      };
      environmentCacheService.addOrUpdateEnvironment(initialEnvironment);

      eventEmitter.emit(TASKS_TRACK, {
        timestamp: Date.now(),
        taskEvent: {
          environmentId: 'env1',
          state: 'RUNNING',
          taskid: 1,
          name: 'task1',
          hostname: 'host1',
          className: 'class1',
          isCritical: false,
        }
      });
      const env = environmentCacheService._environments.get('env1');
      assert.ok(env, 'Environment "env1" should exist in the cache');
      assert.strictEqual(env.firstTaskInError, undefined, 'firstTaskInError should be null when no error task is received');
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 0, 'No broadcast should be made when task is not in ERROR/ERROR_CRITICAL');
    });

    it('should successfully update the environment with first error event when it received the first task in ERROR/ERROR_CRITICAL', () => {
        const initialEnvironment = {
        id: 'env1',
        hardware: {
          epn: {
            info: {
              state: 'INITIAL_STATE',
              ddsSessionId: '67890',
              ddsSessionStatus: 'INACTIVE',
            },
          },
        },
      };
      environmentCacheService.addOrUpdateEnvironment(initialEnvironment);
      const firstTaskInErrorEventSent = {
          environmentId: 'env1',
          state: 'ERROR_CRITICAL',
          taskid: 1,
          name: 'task1',
          hostname: 'host1',
          className: 'class1',
          isCritical: true,
      };
      eventEmitter.emit(TASKS_TRACK, {
        timestamp: Date.now(),
        taskEvent: firstTaskInErrorEventSent
      });
      let env = environmentCacheService._environments.get('env1');
      assert.ok(env, 'Environment "env1" should exist in the cache');
      assert.deepStrictEqual(env.firstTaskInError, firstTaskInErrorEventSent, 'firstTaskInError should Exist');
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 1, 'Broadcast should be made when first task in ERROR/ERROR_CRITICAL is received');

      const secondTaskInError = {
        environmentId: 'env1',
        state: 'ERROR',
        taskid: 2,
        name: 'task1',
        hostname: 'host1',
        className: 'class1',
        isCritical: false,
      };
      eventEmitter.emit(TASKS_TRACK, {
        timestamp: Date.now(),
        taskEvent: secondTaskInError
      });
      env = environmentCacheService._environments.get('env1');
      assert.deepStrictEqual(env.firstTaskInError, firstTaskInErrorEventSent, 'firstTaskInError should still be the first task in error');
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 1, 'Broadcast should not be made again when subsequent task in ERROR/ERROR_CRITICAL is received');
    });

    it('should successfully remove environment from cache on successful DESTROY transition', () => {
      const initialEnvironment = {
        id: 'env1',
        state: EnvironmentState.CONFIGURED
      };
      environmentCacheService.addOrUpdateEnvironment(initialEnvironment);

      eventEmitter.emit(EmitterKeys.ENVIRONMENTS_TRACK, {
        id: 'env1',
        transition: {
          name: EnvironmentTransitionType.DESTROY,
          status: EcsOperationAndStepStatus.DONE_OK
        },
        state: EnvironmentState.DONE
      });

      const env = environmentCacheService._environments.get('env1');
      assert.ok(!env, 'Environment "env1" should be removed from the cache');
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 2, 'Broadcast (event and overview) should be made when environment is removed');
    });

    it('should successfully remove isDeploying flag on CONFIGURED state after deployment', () => {
      const initialEnvironment = {
        id: 'env1',
        isDeploying: true,
        state: EnvironmentState.DEPLOYED
      };
      environmentCacheService.addOrUpdateEnvironment(initialEnvironment);

      eventEmitter.emit(EmitterKeys.ENVIRONMENTS_TRACK, {
        id: 'env1',
        transition: {
          name: EnvironmentTransitionType.CONFIGURE,
          status: EcsOperationAndStepStatus.DONE_OK
        },
        state: EnvironmentState.CONFIGURED
      });
      const env = environmentCacheService._environments.get('env1');
      assert.ok(env, 'Environment "env1" should exist in the cache without isDeploying flag');
      assert.strictEqual(env.isDeploying, false, 'isDeploying flag should be removed after successful deployment');
    });
  });
});
