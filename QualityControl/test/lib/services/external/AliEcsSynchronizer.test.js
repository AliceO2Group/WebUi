/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { ok, deepStrictEqual } from 'node:assert';
import { test, beforeEach, afterEach } from 'node:test';
import { stub, restore } from 'sinon';
import { AliEcsSynchronizer } from '../../../../lib/services/external/AliEcsSynchronizer.js';
import { Transition } from '../../../../common/library/enums/transition.enum.js';
import { EmitterKeys } from '../../../../common/library/enums/emitterKeys.enum.js';

export const aliecsSynchronizerTestSuite = async () => {
  let aliecsSynchronizer = null;
  const ConsumerStub = stub().returns({ onMessageReceived: stub(), start: stub().resolves() });
  const eventEmitterMock = {
    emit: stub().returns(),
  };

  beforeEach(() => {
    aliecsSynchronizer = new AliEcsSynchronizer(undefined, { QCG_RUN: 'QCG_RUN' }, eventEmitterMock, ConsumerStub);
  });

  afterEach(() => {
    eventEmitterMock.emit.resetHistory();
    ConsumerStub.resetHistory();
    restore();
  });

  test('should initialize the aliecs syncronizer with a passed emitter', () => {
    deepStrictEqual(aliecsSynchronizer._eventEmitter, eventEmitterMock);
  });

  test('should warn if a run message is received without runEvent field', () => {
    const loggerWarnStub = stub(aliecsSynchronizer._logger, 'warnMessage');
    aliecsSynchronizer._onRunMessage({ timestamp: { toNumber: () => Date.now() } });
    ok(loggerWarnStub.calledOnce);
    deepStrictEqual(loggerWarnStub.firstCall.args[0], 'Received run message on run topic without runEvent field');
  });

  test('should emit a run track event when a valid run message is received', () => {
    const runNumber = 123;
    const transition = Transition.START_ACTIVITY;
    const timestamp = { toNumber: () => Date.now() } ;
    aliecsSynchronizer._onRunMessage({ runEvent: { runNumber, transition }, timestamp });
    ok(eventEmitterMock.emit.called);
    deepStrictEqual(eventEmitterMock.emit.firstCall.args[0], EmitterKeys.RUN_TRACK);
    deepStrictEqual(eventEmitterMock.emit.firstCall.args[1], {
      runNumber, transition, timestamp: timestamp.toNumber()
    });
  });
};
