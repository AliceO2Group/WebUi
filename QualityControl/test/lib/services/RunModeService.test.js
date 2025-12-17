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

import { suite, test, beforeEach } from 'node:test';
import { strictEqual, deepStrictEqual, ok } from 'assert';
import { EventEmitter } from 'events';
import sinon from 'sinon';
import { RunModeService } from '../../../lib/services/RunModeService.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';
import { EmitterKeys } from '../../../common/library/enums/emitterKeys.enum.js';
import { Transition } from '../../../common/library/enums/transition.enum.js';
import { delayAndCheck } from '../../testUtils/delay.js';

export const runModeServiceTestSuite = async () => {
  suite('RunModeService', () => {
    let runModeService = undefined;
    let bookkeepingService = undefined;
    let dataService = undefined;
    const eventEmitter = new EventEmitter();

    beforeEach(() => {
      bookkeepingService = {
        retrieveRunInformation: sinon.stub(),
      };

      dataService = {
        getObjectsLatestVersionList: sinon.stub(),
      };

      const config = { refreshInterval: 60000 };
      runModeService = new RunModeService(config, bookkeepingService, dataService, eventEmitter);
    });
    suite('retrievePathsAndSetRunStatus', () => {
      test('should retrieve paths and cache them if run is ongoing', async () => {
        const runNumber = 1234;
        const rawPaths = [{ path: '/run/path1' }];

        bookkeepingService.retrieveRunInformation.withArgs(runNumber).resolves({
          runStatus: RunStatus.ONGOING,
        });
        dataService.getObjectsLatestVersionList.resolves(rawPaths);

        const result = await runModeService.retrievePathsAndSetRunStatus(runNumber);

        deepStrictEqual(result, {
          paths: [{ name: '/run/path1' }],
        });

        strictEqual(runModeService._ongoingRuns.has(runNumber), true);
        strictEqual(runModeService._ongoingRuns.get(runNumber), rawPaths);
      });

      test('should not cache if run is not ongoing', async () => {
        const runNumber = 1234;
        const rawPaths = [{ path: '/ended/path' }];

        bookkeepingService.retrieveRunInformation.resolves({
          runStatus: RunStatus.ENDED,
        });
        dataService.getObjectsLatestVersionList.resolves(rawPaths);

        const result = await runModeService.retrievePathsAndSetRunStatus(runNumber);

        deepStrictEqual(result, {
          paths: [{ name: '/ended/path' }],
        });
        strictEqual(runModeService._ongoingRuns.has(runNumber), false);
      });

      test('should return cached result if already exists', async () => {
        const runNumber = 42;
        const cachedPaths = [{ path: '/cached/path' }];
        runModeService._ongoingRuns.set(runNumber, cachedPaths);

        const result = await runModeService.retrievePathsAndSetRunStatus(runNumber);

        deepStrictEqual(result, {
          paths: [{ name: '/cached/path' }],
        });

        sinon.assert.notCalled(bookkeepingService.retrieveRunInformation);
      });
    });

    suite('refreshRunsCache', () => {
      test('should refresh cache by removing ended runs', async () => {
        const runNumber = 1001;

        runModeService._ongoingRuns.set(runNumber, [{ path: '/old/path' }]);
        bookkeepingService.retrieveRunInformation.withArgs(runNumber).resolves({
          runStatus: RunStatus.ENDED,
        });

        await runModeService.refreshRunsCache();
        strictEqual(runModeService._ongoingRuns.has(runNumber), false);
      });

      test('should refresh cache by updating ongoing runs', async () => {
        const runNumber = 2002;
        const updatedPaths = [{ path: '/new/path' }];

        runModeService._ongoingRuns.set(runNumber, [{ path: '/old/path' }]);

        bookkeepingService.retrieveRunInformation.withArgs(runNumber).resolves({
          runStatus: RunStatus.ONGOING,
        });
        dataService.getObjectsLatestVersionList.resolves(updatedPaths);

        await runModeService.refreshRunsCache();
        deepStrictEqual(runModeService._ongoingRuns.get(runNumber), updatedPaths);
      });
    });

    suite('get refreshInterval', () => {
      test('should expose configured refresh interval', () => {
        strictEqual(runModeService.refreshInterval, 60000);
      });
    });

    suite('_onRunTrackEvent - test suite', () => {
      test('should correctly parse event to RUN_TRACK and update ongoing runs map', async () => {
        const runEvent = { runNumber: 1234, transition: 'START_ACTIVITY' };
        runModeService._dataService.getObjectsLatestVersionList = sinon.stub().resolves([{ path: '/path/from/event' }]);

        await runModeService._onRunTrackEvent(runEvent);

        strictEqual(runModeService._ongoingRuns.has(runEvent.runNumber), true);
        ok(runModeService._dataService.getObjectsLatestVersionList.calledOnceWith({
          filters: { RunNumber: runEvent.runNumber },
        }));
      });

      test('should listen to events on RUN_TRACK and update ongoing runs map', async () => {
        const runEvent = { runNumber: 1234, transition: Transition.START_ACTIVITY };
        runModeService._dataService.getObjectsLatestVersionList = sinon.stub().resolves([{ path: '/path/from/event' }]);

        eventEmitter.emit(EmitterKeys.RUN_TRACK, runEvent);
        await delayAndCheck(() => runModeService._ongoingRuns.has(runEvent.runNumber), 500, 10);
        ok(runModeService._ongoingRuns.has(runEvent.runNumber));
        ok(runModeService._dataService.getObjectsLatestVersionList.calledOnceWith({
          filters: { RunNumber: runEvent.runNumber },
        }));
      });

      test('should remove run from ongoing runs map on STOP_ACTIVITY event', async () => {
        const runEventStop = { runNumber: 5678, transition: Transition.STOP_ACTIVITY };
        runModeService._ongoingRuns.set(runEventStop.runNumber, [{ path: '/some/path' }]);

        eventEmitter.emit(EmitterKeys.RUN_TRACK, runEventStop);
        await delayAndCheck(() => !runModeService._ongoingRuns.has(runEventStop.runNumber), 500, 10);
        ok(!runModeService._ongoingRuns.has(runEventStop.runNumber));
      });
    });
  });
};
