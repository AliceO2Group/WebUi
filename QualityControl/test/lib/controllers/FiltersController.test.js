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
    test('should successfully retrieve run types from Bookkeeping service', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const mockedRunTypes = ['runType1', 'runType2'];
      sinon.stub(filterService, 'runTypes').get(() => mockedRunTypes);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {};
      const filterController = new FilterController(filterService);
      await filterController.getFilterConfigurationHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith({ runTypes: mockedRunTypes }), 'Run types were not sent back');
    });
    test('should return an empty array if bookkeeping service is not defined', async () => {
      const bkpService = null;
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {};
      const filterController = new FilterController(bkpService);
      await filterController.getFilterConfigurationHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(
        res.json.calledWith({ runTypes: [] }),
        'Run types were not sent as an empty array',
      );
    });
  });

  suite('getRunStatusHandler', async () => {
    test('should successfully retrieve run status from FilterService', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const mockedRunStatus = 'ONGOING';
      filterService.getRunStatus.resolves(mockedRunStatus);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {
        params: { runNumber: '123' },
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunStatusHandler(req, res);

      ok(
        filterService.getRunStatus.calledWith(123),
        'FilterService.getRunStatus was not called with correct run number',
      );
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith(mockedRunStatus), 'Run status was not sent back correctly');
    });

    test('should return error when run number is not provided', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {
        params: {},
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunStatusHandler(req, res);

      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        status: 400,
        title: 'Invalid Input',
        message: 'Run number not provided',
      }), 'Error message was not sent back');
      ok(filterService.getRunStatus.notCalled, 'FilterService.getRunStatus should not have been called');
    });

    test('should return error when run number format is invalid', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {
        params: { runNumber: 'invalid' },
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunStatusHandler(req, res);

      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWithMatch({
        status: 400,
        title: 'Invalid Input',
        message: 'Invalid run number format',
      }), 'Error message was not sent back');
      ok(filterService.getRunStatus.notCalled, 'FilterService.getRunStatus should not have been called');
    });
    test('should return error when service throws', async () => {
      const filterService = sinon.createStubInstance(FilterService);
      const error = new Error();
      filterService.getRunStatus.rejects(error);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {
        params: { runNumber: '123' },
      };

      const filterController = new FilterController(filterService);
      await filterController.getRunStatusHandler(req, res);

      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWithMatch({
        status: 500,
        title: 'Unknown Error',
        message: 'Failed to retrieve run status',
      }), 'Error message was not sent back');
    });
  });
};
