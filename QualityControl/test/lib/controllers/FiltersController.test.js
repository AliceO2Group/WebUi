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

export const filtersControllerTestSuite = async () => {
  suite('Creating a new FiltersController instance', () => {
    test('should successfully initialize FiltersController', () => {
      const bookkeepingServiceStub = {
        connect: sinon.stub().resolves(),
      };
      const filterService = new FilterService(bookkeepingServiceStub);
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
};
