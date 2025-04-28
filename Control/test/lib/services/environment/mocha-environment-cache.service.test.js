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
const proxyquire = require('proxyquire');
const EventEmitter = require('events');
const { EmitterKeys: {ENVIRONMENTS_TRACK, INTEGRATED_SERVICES_TRACK: { ODC }} } = require('../../../../lib/common/emitterKeys.enum.js');
const { BroadcastKeys: {ENVIRONMENT_EVENTS, ENVIRONMENTS_OVERVIEW} } = require('../../../../lib/common/broadcastKeys.enum.js');

describe(`'EnvironmentCacheService' - test suite`, () => {
  let EnvironmentCacheService;
  let broadcastServiceMock;
  let eventEmitter;
  let environmentCacheService;
  let fromEcsEventToEnvironmentEventStub;

  beforeEach(() => {
    broadcastServiceMock = {
      broadcast: sinon.stub(),
    };

    eventEmitter = new EventEmitter();

    fromEcsEventToEnvironmentEventStub = sinon.stub();

    EnvironmentCacheService = proxyquire(
      '../../../../lib/services/environment/EnvironmentCache.service.js',
      {
        './../../kafka/adapters/fromEcsEventToEnvironmentEvent.js': {
          fromEcsEventToEnvironmentEvent: fromEcsEventToEnvironmentEventStub,
        },
      }
    ).EnvironmentCacheService;

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

      environmentCacheService.addOrUpdateEnvironment(environments[0]);

      assert.strictEqual(environmentCacheService._environments.size, 1);
      assert.deepStrictEqual(environmentCacheService._environments.get('abc123'), {
        id: 'abc123',
        state: 'active',
        events: [],
      });
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 1);

      const updatedEnvironments = { id: 'abc123', state: 'inactive' };

      environmentCacheService.addOrUpdateEnvironment(updatedEnvironments);

      assert.strictEqual(environmentCacheService._environments.size, 1);
      assert.deepStrictEqual(environmentCacheService._environments.get('abc123'), {
        id: 'abc123',
        state: 'inactive',
        events: []
      });
      assert.strictEqual(broadcastServiceMock.broadcast.callCount, 2);
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

  it('should initialize class with an empty environment cache map', () => {
    assert.strictEqual(environmentCacheService._environments.size, 0);
  });

  it('should add a new environment to the cache and broadcast it when receiving first event', () => {
    const environmentEvent = { id: 'abc123', timestamp: Date.now() };
    const transformedEvent = { id: 'abc123', lastUpdate: environmentEvent.timestamp };

    fromEcsEventToEnvironmentEventStub.returns(transformedEvent);

    eventEmitter.emit(ENVIRONMENTS_TRACK, environmentEvent);

    assert.ok(environmentCacheService._environments.has('abc123'));
    assert.strictEqual(environmentCacheService._environments.get('abc123').lastUpdate, environmentEvent.timestamp);
    assert.ok(broadcastServiceMock.broadcast.calledOnce);
    assert.ok(broadcastServiceMock.broadcast.calledWith(ENVIRONMENT_EVENTS, sinon.match.object));
  });

  it('should update an existing environment in the cache and broadcast it', () => {
    const initialEvent = { id: 'abc135', timestamp: Date.now() - 1000 };
    const updatedEvent = { id: 'abc135', timestamp: Date.now() };
    const transformedEvent = { id: 'abc135', events: [], lastUpdate: updatedEvent.timestamp };

    fromEcsEventToEnvironmentEventStub.returns(transformedEvent);

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
});
