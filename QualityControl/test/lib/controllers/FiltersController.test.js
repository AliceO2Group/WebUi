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
import { BookkeepingService } from '../../../lib/services/BookkeepingService.js';
import sinon from 'sinon';

export const filtersControllerTestSuite = async () => {
  suite('Creating a new FiltersController instance', async () => {
    test('should successfully initialize FiltersController', async () => {
      const bkpService = new BookkeepingService({});
      doesNotThrow(() => new FilterController(bkpService));
    });
  });

  suite('getRunTypesHandler', async () => {
    test('should successfully retrieve run types from Bookkeeping service', async () => {
      const bkpService = {
        runTypes: ['runType1', 'runType2'],
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {};
      const filterController = new FilterController(bkpService);
      await filterController.getRunTypesHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith(bkpService.runTypes), 'Run types were not sent back');
    });
    test('should return a 503 error if Bookkeeping service is not defined', async () => {
      const bkpService = null;
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const req = {};
      const filterController = new FilterController(bkpService);
      await filterController.getRunTypesHandler(req, res);
      ok(res.status.calledWith(503), 'Response status was not 503');
      ok(
        res.json.calledWith({ error: 'Bookkeeping service is not available' }),
        'Error message was incorrect',
      );
    });
  });
};
