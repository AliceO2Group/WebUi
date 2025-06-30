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

import { suite, test, beforeEach, before } from 'node:test';
import { strictEqual, deepStrictEqual, ok } from 'assert';
import sinon from 'sinon';
import { RunModeService } from '../../../lib/services/RunModeService.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';
import { LogManager } from '@aliceo2/web-ui';

export const runMonitoringServiceTestSuite = async () => {
  suite('RunModeService', () => {
    let objectServiceMock = null;
    let filterServiceMock = null;
    let intervalsServiceMock = null;
    let runModeService = null;
    let mockedLogger = null;

    const queryKey = 'testQueryKey';
    const runNumber = '123';
    const callbackParams = { filters: { RunNumber: runNumber } };
    const callbackResult = { value: 'testData' };
    const callback = sinon.stub().resolves(callbackResult);

    before(() => {
      mockedLogger = {
        infoMessage: sinon.stub(),
        debugMessage: sinon.stub(),
        errorMessage: sinon.stub(),
      };
      sinon.replace(LogManager, 'getLogger', () => mockedLogger);
    });

    beforeEach(async () => {
      objectServiceMock = {
        setRunCache: sinon.stub(),
        removeRunCache: sinon.stub(),
      };

      filterServiceMock = {
        getRunStatus: sinon.stub(),
        runStatusRefreshInterval: 1000,
      };

      intervalsServiceMock = {
        activeInterval: sinon.stub().returns(false),
        register: sinon.stub(),
        deregister: sinon.stub(),
      };

      runModeService = new RunModeService(objectServiceMock, filterServiceMock, intervalsServiceMock);
    });

    test('should start monitoring when run is active', async () => {
      filterServiceMock.getRunStatus.resolves(RunStatus.ONGOING);

      await runModeService.retrievePathsAndSetRunStatus(queryKey, callbackParams, callback);

      strictEqual(intervalsServiceMock.register.calledOnce, true);
      strictEqual(objectServiceMock.setRunCache.calledOnce, true);
      ok(mockedLogger.debugMessage.calledOnce);
      ok(mockedLogger.debugMessage.firstCall.args[0].includes(queryKey));
      deepStrictEqual(objectServiceMock.setRunCache.firstCall.args[0], queryKey);
      deepStrictEqual(objectServiceMock.setRunCache.firstCall.args[1].data, callbackResult);
    });

    test('should not start monitoring when run is not active', async () => {
      filterServiceMock.getRunStatus.resolves(RunStatus.ENDED);

      await runModeService.retrievePathsAndSetRunStatus(queryKey, callbackParams, callback);

      strictEqual(intervalsServiceMock.register.called, false);
      strictEqual(objectServiceMock.setRunCache.called, false);
    });

    test('should setup monitoring for active run when not cached', async () => {
      const queryKey = 'testQueryKey';
      const mockRunNumber = '12345';
      const mockData = { result: 'testData' };
      const callbackParams = { filters: { RunNumber: mockRunNumber } };
      const callback = sinon.stub().resolves(mockData);

      filterServiceMock.getRunStatus.withArgs(mockRunNumber).resolves(RunStatus.ONGOING);
      intervalsServiceMock.activeInterval.withArgs(queryKey).returns(false);

      objectServiceMock.setRunCache = sinon.spy();

      await runModeService.retrievePathsAndSetRunStatus(queryKey, callbackParams, callback);

      ok(intervalsServiceMock.register.calledOnce, 'Expected interval to be registered');
      ok(objectServiceMock.setRunCache.calledOnce, 'Expected cache to be set');

      const [[keySet, cacheSet]] = objectServiceMock.setRunCache.args;
      strictEqual(keySet, queryKey, 'Cache key mismatch');
      deepStrictEqual(cacheSet.data, mockData, 'Cached data mismatch');

      const correctTimestamp = Date.now() - cacheSet.timestamp < 100;
      ok(correctTimestamp, 'The timestamp for the cache is incorrect.');
    });

    test('should skip if already monitoring', async () => {
      filterServiceMock.getRunStatus.resolves(RunStatus.ONGOING);
      intervalsServiceMock.activeInterval.returns(true);

      await runModeService.retrievePathsAndSetRunStatus(queryKey, callbackParams, callback);

      strictEqual(intervalsServiceMock.register.called, false);
      strictEqual(objectServiceMock.setRunCache.called, false);
    });

    test('should stop monitoring when run is no longer active', async () => {
      filterServiceMock.getRunStatus.resolves(RunStatus.ENDED);

      await runModeService._checkStatusAndUpdateCache(queryKey, callbackParams, callback);

      strictEqual(intervalsServiceMock.deregister.calledWith(queryKey), true);
      strictEqual(objectServiceMock.removeRunCache.calledWith(queryKey), true);
    });

    test('should log error when callback or status check fails', async () => {
      filterServiceMock.getRunStatus.rejects(new Error('error getting status'));

      await runModeService._checkStatusAndUpdateCache(queryKey, callbackParams, callback);

      ok(mockedLogger.errorMessage.calledOnce);
      ok(mockedLogger.errorMessage.firstCall.args[0].includes('error getting status'));
    });
  });
};
