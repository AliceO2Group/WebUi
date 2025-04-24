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
const { EmitterKeys: {ENVIRONMENTS_TRACK} } = require('../../../../lib/common/emitterKeys.enum.js');
const { BroadcastKeys: {ENVIRONMENTS} } = require('../../../../lib/common/broadcastKeys.enum.js');

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

  it('should initialize class with an empty environment cache map', () => {
    assert.strictEqual(environmentCacheService._environments.size, 0);
  });

  it('should add a new environment to the cache and broadcast it when receiving first event', () => {
    const environmentEvent = { id: 'abc123', timestamp: Date.now() };
    const transformedEvent = { id: 'abc123', events: [], lastUpdate: environmentEvent.timestamp };

    fromEcsEventToEnvironmentEventStub.returns(transformedEvent);

    eventEmitter.emit(ENVIRONMENTS_TRACK, environmentEvent);

    assert.ok(environmentCacheService._environments.has('abc123'));
    assert.strictEqual(environmentCacheService._environments.get('abc123').lastUpdate, environmentEvent.timestamp);
    assert.ok(broadcastServiceMock.broadcast.calledOnce);
    assert.ok(broadcastServiceMock.broadcast.calledWith(ENVIRONMENTS, sinon.match.object));
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

  it('should handle errors thrown during event processing', () => {
    const loggerSpy = sinon.spy(environmentCacheService._logger, 'errorMessage');
    const faultyEvent = { id: 'abc1=246', timestamp: Date.now() };

    fromEcsEventToEnvironmentEventStub.throws(new Error('Test error'));

    eventEmitter.emit(ENVIRONMENTS_TRACK, faultyEvent);

    assert.ok(loggerSpy.calledOnce);
    assert.ok(loggerSpy.args[0][0].includes('Error while processing environment event: Error: Test error'));
    assert.ok(broadcastServiceMock.broadcast.notCalled);
  });
});
