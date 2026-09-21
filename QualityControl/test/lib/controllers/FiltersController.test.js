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

import { doesNotThrow, ok } from 'node:assert';
import { suite, test } from 'node:test';
import { FilterController } from '../../../lib/controllers/FilterController.js';
import sinon from 'sinon';
import { FilterService } from '../../../lib/services/FilterService.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';

const VALID_CONFIG = { bookkeeping: {
  url: 'http://localhost:4000',
  token: 'valid-token',
  runTypesRefreshInterval: 15000,
  runStatusRefreshInterval: 15000,
} };

export const filtersControllerTestSuite = async () => {
  suite('Creating a new FiltersController instance', () => {
    test('should successfully initialize FiltersController', () => {
      const bookkeepingServiceStub = {
        connect: sinon.stub().resolves(),
      };
      const filterService = new FilterService(bookkeepingServiceStub, VALID_CONFIG);
      doesNotThrow(() => new FilterController(filterService));
    });
  });

  suite('getFilterConfigurationHandler', async () => {
    test('should successfully retrieve run types, detectors and data passes from Bookkeeping service', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const mockedRunTypes = ['runType1', 'runType2'];
      const mockedDetectors = [
        {
          name: 'ITS',
          type: 'PHYSICAL',
        },
      ];
      const mockedDataPasses = [
        {
          name: 'LHC22a_apass1',
          isFrozen: false,
        },
      ];
      sinon.stub(filterService, 'runTypes').get(() => mockedRunTypes);
      sinon.stub(filterService, 'detectors').get(() => mockedDetectors);
      sinon.stub(filterService, 'dataPasses').get(() => mockedDataPasses);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {};
      const filterController = new FilterController(filterService);
      filterController.getFilterConfigurationHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(
        res.json.calledWith({ runTypes: mockedRunTypes, detectors: mockedDetectors, dataPasses: mockedDataPasses }),
        'Response should include runTypes, detectors and dataPasses',
      );
    });
    test('should return an empty arrays if bookkeeping service is not defined', async () => {
      const bkpService = null;
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {};
      const filterController = new FilterController(bkpService);
      filterController.getFilterConfigurationHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(
        res.json.calledWith({ runTypes: [], detectors: [], dataPasses: [] }),
        'runTypes, detectors and dataPasses were not sent as an empty array',
      );
    });
  });

  suite('getRunStatusHandler', async () => {
    test('should successfully retrieve run status from FilterService', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      filterService.getRunInformation.resolves({
        runStatus: RunStatus.ONGOING,
      });

      const req = {
        params: {
          runNumber: 123456,
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunInformationHandler(req, res);

      ok(
        filterService.getRunInformation.calledWith(123456),
        'FilterService.getRunInformation should be called with run number',
      );
      ok(res.status.calledWith(200), 'Response status should be 200');
      ok(res.json.calledWith({
        runStatus: RunStatus.ONGOING,
      }), 'Response should contain the run status');
    });

    test('should handle errors from FilterService and send error response', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const testError = new Error('Bookkeeping service unavailable');
      filterService.getRunInformation.rejects(testError);

      const req = {
        params: {
          runNumber: 123456,
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunInformationHandler(req, res);

      ok(
        filterService.getRunInformation.calledWith(123456),
        'FilterService.getRunStatus should be called with run number',
      );
      ok(res.status.calledWith(500), 'Response status should be 500 for service errors');
      ok(res.json.calledWithMatch({
        message: 'Bookkeeping service unavailable',
        status: 500,
        title: 'Unknown Error',
      }), 'Response should contain error details');
    });

    test('should return UNKNOWN status when FilterService returns invalid status', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      filterService.getRunInformation.resolves({
        runStatus: RunStatus.UNKNOWN,
      });

      const req = {
        params: {
          runNumber: 999999,
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunInformationHandler(req, res);

      ok(
        filterService.getRunInformation.calledWith(999999),
        'FilterService.getRunStatus should be called with run number',
      );
      ok(res.status.calledWith(200), 'Response status should be 200');
      ok(res.json.calledWith({
        runStatus: RunStatus.UNKNOWN,
      }), 'Response should contain UNKNOWN status');
    });
  });
};
