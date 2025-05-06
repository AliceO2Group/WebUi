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

import { strictEqual, deepStrictEqual } from 'node:assert';
import { suite, test, before } from 'node:test';
import nock from 'nock';

import { BookkeepingService } from '../../../lib/services/BookkeepingService.js';
import { config } from '../../config.js';

/**
 * Tests for the Bookkeeping service
 */
export const bookkeepingServiceTestSuite = async () => {
  suite('Bookkeeping Test Suite', () => {
    before(() => nock.cleanAll());

    suite('Create a new instance of BookkeepingService', () => {
      test('should successfully initialize Bookkeeping Service', () => {
        const bookkeepingService = new BookkeepingService(config.bookkeeping);
        const bkpUrl = new URL(config.bookkeeping.url);
        strictEqual(bookkeepingService._hostname, bkpUrl.hostname);
        strictEqual(bookkeepingService._port, bkpUrl.port);
        strictEqual(bookkeepingService._protocol, bkpUrl.protocol);
        strictEqual(bookkeepingService._getRunTypesPath, `/api/runTypes?token=${config.bookkeeping.token}`);
        strictEqual(bookkeepingService._refreshInterval, config.bookkeeping.refreshRate);
      });
    });

    suite('Retrieve run types', () => {
      let bkpService = undefined;
      before(() => {
        bkpService = new BookkeepingService(config.bookkeeping);
      });

      test('should successfully retrieve run types from Bookkeeping', async () => {
        const mockResponse = {
          data: [
            { name: 'test1' },
            { name: 'test2' },
          ],
        };
        nock('http://alio2-cr1-hv-mvs00.cern.ch:4000')
          .get(`/api/runTypes?token=${config.bookkeeping.token}`)
          .reply(200, mockResponse);
        const result = await bkpService.retrieveRunTypes();
        deepStrictEqual(result, mockResponse.data);
        strictEqual(result.length, 2);
        strictEqual(result[0].name, 'test1');
        strictEqual(result[1].name, 'test2');
      });
    });
  });
};
