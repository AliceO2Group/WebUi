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

import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import { FilterService } from '../../../lib/services/FilterService.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';
import { stub, restore } from 'sinon';

export const filterServiceTestSuite = async () => {
  let filterService = null;
  let bookkeepingServiceMock = null;
  const configMock = {
    bookkeeping: {
      runTypesRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
      dataPassesRefreshInterval: 60 * 60 * 1000, // 1 hour
    },
  };

  beforeEach(() => {
    bookkeepingServiceMock = {
      connect: stub(),
      retrieveRunTypes: stub(),
      retrieveRunInformation: stub(),
      retrieveDetectorSummaries: stub(),
      retrieveDataPasses: stub(),
      active: true, // assume the bookkeeping service is active by default
    };
    filterService = new FilterService(bookkeepingServiceMock, configMock);
  });

  afterEach(() => {
    restore();
  });

  suite('constructor', async () => {
    test('should initialize with a bookkeeping service and config', () => {
      deepStrictEqual(filterService._bookkeepingService, bookkeepingServiceMock);
      deepStrictEqual(filterService._runTypesRefreshInterval, configMock.bookkeeping.runTypesRefreshInterval);
    });

    test('should set runTypesRefreshInterval to -1 if not provided in config', () => {
      const filterServiceWithoutConfig = new FilterService(bookkeepingServiceMock, {});
      deepStrictEqual(filterServiceWithoutConfig._runTypesRefreshInterval, -1);
    });

    test('should set run types refresh interval to default if not provided', () => {
      const filterServiceWithDefaultConfig = new FilterService(bookkeepingServiceMock, { bookkeeping: {} });
      deepStrictEqual(filterServiceWithDefaultConfig._runTypesRefreshInterval, 24 * 60 * 60 * 1000);
    });

    test('should set data passes refresh interval to default if not provided', () => {
      const filterServiceWithDefaultConfig = new FilterService(bookkeepingServiceMock, { bookkeeping: {} });
      strictEqual(filterServiceWithDefaultConfig._dataPassesRefreshInterval, 6 * 60 * 60 * 1000);
    });

    test('should set run types refresh interval to the value from config', () => {
      const customConfig = { bookkeeping: { runTypesRefreshInterval: 5000 } };
      const filterServiceWithCustomConfig = new FilterService(bookkeepingServiceMock, customConfig);
      deepStrictEqual(filterServiceWithCustomConfig._runTypesRefreshInterval, 5000);
    });

    test('should set data passes refresh interval to the value from config', () => {
      const customConfig = { bookkeeping: { dataPassesRefreshInterval: 5000 } };
      const filterServiceWithCustomConfig = new FilterService(bookkeepingServiceMock, customConfig);
      strictEqual(filterServiceWithCustomConfig._dataPassesRefreshInterval, 5000);
    });

    test('should init _detectors on instantiation', async () => {
      deepStrictEqual(filterService._detectors, []);
      ok(Object.isFrozen(filterService._detectors));
    });

    test('should init _dataPasses on instantiation', async () => {
      deepStrictEqual(filterService._dataPasses, []);
      ok(Object.isFrozen(filterService._dataPasses));
    });

    test('should init filters on instantiation', async () => {
      const initFiltersStub = stub(filterService, 'initFilters');
      await filterService.initFilters();
      deepStrictEqual(initFiltersStub.calledOnce, true);
    });
  });

  suite('initFilters', async () => {
    test('should call _initializeDetectors', async () => {
      const initializeDetectorsStub = stub(filterService, '_initializeDetectors');
      await filterService.initFilters();
      ok(initializeDetectorsStub.calledOnce);
    });

    test('should set _detectors on _initializeDetectors call', async () => {
      const DETECTOR_SUMMARIES = [
        {
          name: 'Detector human-readable name',
          type: 'Detector type identifier',
        },
        {
          name: '',
          type: 'OTHER',
        },
        {
          name: 'Another Detector',
          type: '',
        },
      ];

      bookkeepingServiceMock.retrieveDetectorSummaries.resolves(DETECTOR_SUMMARIES);
      await filterService._initializeDetectors();

      deepStrictEqual(filterService._detectors, [DETECTOR_SUMMARIES[0]]);
      ok(Object.isFrozen(filterService._detectors));
    });

    test('should call getDataPasses', async () => {
      const getDataPassesStub = stub(filterService, 'getDataPasses');
      await filterService.initFilters();
      ok(getDataPassesStub.calledOnce);
    });

    test('should set _dataPasses on getDataPasses call', async () => {
      const DATA_PASSES = [
        {
          name: 'Data pass human-readable name 1',
          isFrozen: false,
          dummy: 'some dummy data that should be removed',
        },
        {
          name: 'Data pass human-readable name 2',
          isFrozen: true,
          dummy: 'some more dummy data that should be removed',
        },
      ];

      bookkeepingServiceMock.retrieveDataPasses.resolves(DATA_PASSES);
      await filterService.getDataPasses();

      const EXPECTED_DATA_PASSES = DATA_PASSES.map(({ name, isFrozen }) => ({ name, isFrozen }));
      deepStrictEqual(filterService._dataPasses, EXPECTED_DATA_PASSES);
      ok(Object.isFrozen(filterService._dataPasses));
    });
  });

  suite('getRunTypes', async () => {
    test('should return if bookkeeping service is not active', async () => {
      filterService._bookkeepingService.active = false;
      await filterService.getRunTypes();
      deepStrictEqual(filterService._runTypes, []);
    });

    test('should retrieve run types sorted from bookkeeping service', async () => {
      filterService._bookkeepingService.retrieveRunTypes.resolves([{ name: 'type2' }, { name: 'type1' }]);
      await filterService.getRunTypes();
      deepStrictEqual(filterService._runTypes, ['type1', 'type2']);
    });

    test('should empty run types on error', async () => {
      filterService._bookkeepingService.retrieveRunTypes.rejects(new Error('Error retrieving run types'));
      await filterService.getRunTypes();
      deepStrictEqual(filterService._runTypes, []);
    });
  });

  suite('runTypesRefreshInterval', async () => {
    test('should return the run types refresh interval', () => {
      deepStrictEqual(filterService.runTypesRefreshInterval, configMock.bookkeeping.runTypesRefreshInterval);
    });

    test('should return -1 if no interval is set', () => {
      const filterServiceWithoutConfig = new FilterService(bookkeepingServiceMock, {});
      deepStrictEqual(filterServiceWithoutConfig.runTypesRefreshInterval, -1);
    });
  });

  suite('dataPassesRefreshInterval', async () => {
    test('should return the data passes refresh interval', () => {
      strictEqual(filterService.dataPassesRefreshInterval, configMock.bookkeeping.dataPassesRefreshInterval);
    });

    test('should return -1 if bookkeeping config is not set', () => {
      const filterServiceWithoutConfig = new FilterService(bookkeepingServiceMock, {});
      strictEqual(filterServiceWithoutConfig.dataPassesRefreshInterval, -1);
    });
  });

  suite('runTypes', async () => {
    test('should return the list of run types', () => {
      filterService._runTypes = ['type1', 'type2'];
      deepStrictEqual(filterService.runTypes, ['type1', 'type2']);
    });

    test('should return an empty array if no run types are set', () => {
      filterService._runTypes = [];
      deepStrictEqual(filterService.runTypes, []);
    });
  });

  suite('getRunInformation', async () => {
    test('should return run status from bookkeeping service when valid', async () => {
      bookkeepingServiceMock.retrieveRunInformation.resolves({
        runStatus: RunStatus.ONGOING,
      });

      const { runStatus } = await filterService.getRunInformation(123456);

      deepStrictEqual(bookkeepingServiceMock.retrieveRunInformation.calledWith(123456), true);
      deepStrictEqual(runStatus, RunStatus.ONGOING);
    });

    test('should return ENDED status from bookkeeping service', async () => {
      bookkeepingServiceMock.retrieveRunInformation.resolves({
        runStatus: RunStatus.ENDED,
      });

      const { runStatus } = await filterService.getRunInformation(789012);

      deepStrictEqual(bookkeepingServiceMock.retrieveRunInformation.calledWith(789012), true);
      deepStrictEqual(runStatus, RunStatus.ENDED);
    });

    test('should return NOT_FOUND status from bookkeeping service', async () => {
      bookkeepingServiceMock.retrieveRunInformation.resolves({
        runStatus: RunStatus.NOT_FOUND,
      });

      const { runStatus } = await filterService.getRunInformation(345678);

      deepStrictEqual(bookkeepingServiceMock.retrieveRunInformation.calledWith(345678), true);
      deepStrictEqual(runStatus, RunStatus.NOT_FOUND);
    });

    test('should return UNKNOWN when bookkeeping service throws error', async () => {
      const testError = new Error('Bookkeeping service unavailable');
      bookkeepingServiceMock.retrieveRunInformation.rejects(testError);

      const { runStatus } = await filterService.getRunInformation(123456);

      deepStrictEqual(bookkeepingServiceMock.retrieveRunInformation.calledWith(123456), true);
      deepStrictEqual(runStatus, RunStatus.UNKNOWN);
    });
  });
};
