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
import { strictEqual, deepStrictEqual } from 'assert';
import sinon from 'sinon';
import { RunModeService } from '../../../lib/services/RunModeService.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';

export const runModeServiceTestSuite = async () => {
  suite('RunModeService', () => {
    let runModeService = undefined;
    let bookkeepingService = undefined;
    let dataService = undefined;

    beforeEach(() => {
      bookkeepingService = {
        retrieveRunStatus: sinon.stub(),
      };

      dataService = {
        getObjectsLatestVersionList: sinon.stub(),
      };

      const config = { refreshInterval: 60000 };
      runModeService = new RunModeService(config, bookkeepingService, dataService);
    });
    suite('retrievePathsAndSetRunStatus', () => {
      test('should retrieve paths and cache them if run is ongoing', async () => {
        const runNumber = 1234;
        const expectedPaths = [{ path: '/run/path1' }];

        bookkeepingService.retrieveRunStatus.withArgs(runNumber).resolves(RunStatus.ONGOING);
        dataService.getObjectsLatestVersionList.resolves(expectedPaths);

        const result = await runModeService.retrievePathsAndSetRunStatus(runNumber);

        strictEqual(result, expectedPaths);
        strictEqual(runModeService._ongoingRuns.has(runNumber), true);
        strictEqual(runModeService._ongoingRuns.get(runNumber), expectedPaths);
      });

      test('should not cache if run is not ongoing', async () => {
        const runNumber = 1234;
        const expectedPaths = [{ path: '/ended/path' }];

        bookkeepingService.retrieveRunStatus.resolves(RunStatus.ENDED);
        dataService.getObjectsLatestVersionList.resolves(expectedPaths);

        const result = await runModeService.retrievePathsAndSetRunStatus(runNumber);

        strictEqual(result, expectedPaths);
        strictEqual(runModeService._ongoingRuns.has(runNumber), false);
      });

      test('should return cached result if already exists', async () => {
        const runNumber = 42;
        const cachedPaths = [{ path: '/cached/path' }];
        runModeService._ongoingRuns.set(runNumber, cachedPaths);

        const result = await runModeService.retrievePathsAndSetRunStatus(runNumber);

        strictEqual(result, cachedPaths);
        sinon.assert.notCalled(bookkeepingService.retrieveRunStatus);
      });
    });

    suite('refreshRunsCache', () => {
      test('should refresh cache by removing ended runs', async () => {
        const runNumber = 1001;

        runModeService._ongoingRuns.set(runNumber, [{ path: '/old/path' }]);
        bookkeepingService.retrieveRunStatus.withArgs(runNumber).resolves(RunStatus.FINISHED);

        await runModeService.refreshRunsCache();
        strictEqual(runModeService._ongoingRuns.has(runNumber), false);
      });

      test('should refresh cache by updating ongoing runs', async () => {
        const runNumber = 2002;
        const updatedPaths = [{ path: '/new/path' }];

        runModeService._ongoingRuns.set(runNumber, [{ path: '/old/path' }]);

        bookkeepingService.retrieveRunStatus.withArgs(runNumber).resolves(RunStatus.ONGOING);
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
  });
};
