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

import { strictEqual, deepStrictEqual, ok } from 'node:assert';
import { suite, test, before, beforeEach, afterEach } from 'node:test';
import nock from 'nock';
import { stub, restore } from 'sinon';

import { BookkeepingService } from '../../../lib/services/BookkeepingService.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';

/**
 * Tests for the Bookkeeping service
 */
export const bookkeepingServiceTestSuite = async () => {
  suite('Bookkeeping Test Suite', () => {
    const VALID_CONFIG = {
      bookkeeping: {
        url: 'http://localhost:4000',
        token: 'valid-token',
        runTypesRefreshInterval: 15000,
        runStatusRefreshInterval: 15000,
      },
    };
    before(() => nock.cleanAll());
    suite('Create a new instance of BookkeepingService', () => {
      test('should successfully initialize Bookkeeping Service', () => {
        const bookkeepingService = new BookkeepingService(VALID_CONFIG.bookkeeping);
        strictEqual(bookkeepingService.config, VALID_CONFIG.bookkeeping);
        strictEqual(bookkeepingService.active, false);
        strictEqual(bookkeepingService.error, null);
        strictEqual(bookkeepingService._hostname, '');
        strictEqual(bookkeepingService._port, null);
        strictEqual(bookkeepingService._token, '');
        strictEqual(bookkeepingService._protocol, '');
      });
    });

    suite('validateConfig', () => {
      test('should return false if no config provided', () => {
        const service = new BookkeepingService();
        const result = service.validateConfig();
        strictEqual(result, false);
        strictEqual(service.error, 'Configuration for bookkeeping not provided');
      });

      test('should return false if url provided is not valid', () => {
        const invalidConfig = {
          url: 'not-a-valid-url',
          token: 'some-token',
        };
        const service = new BookkeepingService(invalidConfig);
        const result = service.validateConfig();
        strictEqual(result, false);
        strictEqual(service.error, 'Invalid configuration. not-a-valid-url is not a valid URL');
      });

      test('should return false if token not valid', () => {
        const invalidConfig = {
          url: 'http://example.com',
          token: '',
        };
        const service = new BookkeepingService(invalidConfig);
        const result = service.validateConfig();
        strictEqual(result, false);
        strictEqual(service.error, 'Invalid configuration. Token not provided or empty');
      });

      test('should return true if configuration is correct', () => {
        const validConfig = {
          url: 'http://example.com',
          token: 'my-token',
        };
        const service = new BookkeepingService(validConfig);
        const result = service.validateConfig();
        strictEqual(result, true);
        strictEqual(service._hostname, 'example.com');
        strictEqual(service._protocol, 'http:');
        strictEqual(service._port, 80);
        strictEqual(service._token, 'my-token');
      });
    });
    suite('connect', () => {
      let service = null;
      let validConfig = null;
      let simulateStub = null;

      beforeEach(() => {
        validConfig = {
          url: 'http://example.com',
          token: 'valid-token',
        };
        service = new BookkeepingService(validConfig);
      });

      afterEach(() => {
        restore();
      });

      test('should return if config is not valid', async () => {
        const svc = new BookkeepingService();
        await svc.connect();
        strictEqual(svc.active, false);
        ok(svc.error.includes('Configuration for bookkeeping not provided'));
      });

      test('should call simulateConnection if config is valid and set active to true', async () => {
        simulateStub = stub(service, 'simulateConnection').resolves(true);
        await service.connect();
        ok(simulateStub.calledOnce);
        strictEqual(service.active, true);
        strictEqual(service.error, null);
      });

      test('should set an error if simulateConnection fails', async () => {
        stub(service, 'simulateConnection').callsFake(async function () {
          this.error = 'Error trying to connect to Bookkeeping: simulated failure';
          return false;
        });

        await service.connect();

        strictEqual(service.active, false);
        ok(service.error.includes('Error trying to connect to Bookkeeping'));
        ok(service.error.includes('simulated failure'));
      });
    });
    suite('simulateConnection', () => {
      let service = null;

      beforeEach(() => {
        service = new BookkeepingService(VALID_CONFIG.bookkeeping);
        service.validateConfig();
      });

      afterEach(() => {
        nock.cleanAll();
      });

      test('should return true when service responds with ok and configured', async () => {
        nock(VALID_CONFIG.bookkeeping.url)
          .get('/api/status/database')
          .query({ token: VALID_CONFIG.bookkeeping.token })
          .reply(200, {
            data: {
              status: {
                ok: true,
                configured: true,
              },
            },
          });

        const result = await service.simulateConnection();
        strictEqual(result, true);
        strictEqual(service.error, null);
      });

      test('should return false when status is not ok or not configured', async () => {
        nock(VALID_CONFIG.bookkeeping.url)
          .get('/api/status/database')
          .query({ token: VALID_CONFIG.bookkeeping.token })
          .reply(200, {
            data: {
              status: {
                ok: false,
                configured: false,
              },
            },
          });

        const result = await service.simulateConnection();
        strictEqual(result, false);
      });

      test('should return false and set error on request failure', async () => {
        nock(VALID_CONFIG.bookkeeping.url)
          .get('/api/status/database')
          .query({ token: VALID_CONFIG.bookkeeping.token })
          .replyWithError('connection failed');

        const result = await service.simulateConnection();
        strictEqual(result, false);
        strictEqual(
          service.error.includes('Error trying to connect to Bookkeeping'),
          true,
        );
        strictEqual(service.error.includes('connection failed'), true);
      });
    });

    suite('Retrieve run types', () => {
      let bkpService = null;

      beforeEach(() => {
        bkpService = new BookkeepingService(VALID_CONFIG.bookkeeping);
        bkpService.validateConfig(); // ensures internal fields like _hostname/_port/_token are set
        bkpService.connect();
      });

      afterEach(() => {
        nock.cleanAll();
      });

      test('should successfully retrieve run types from Bookkeeping', async () => {
        const mockResponse = {
          data: [
            { name: 'test1' },
            { name: 'test2' },
          ],
        };

        nock(VALID_CONFIG.bookkeeping.url)
          .get('/api/runTypes')
          .query({ token: VALID_CONFIG.bookkeeping.token })
          .reply(200, mockResponse);

        const result = await bkpService.retrieveRunTypes();

        deepStrictEqual(result, mockResponse.data);
        strictEqual(result.length, 2);
        strictEqual(result[0].name, 'test1');
        strictEqual(result[1].name, 'test2');
      });
    });

    suite('Retrieve run status', () => {
      let bkpService = null;
      const runsPathPattern = new RegExp(`/api/runs/\\d+\\?token=${VALID_CONFIG.bookkeeping.token}`);

      beforeEach(() => {
        bkpService = new BookkeepingService(VALID_CONFIG.bookkeeping);
        bkpService.validateConfig();
        bkpService.active = true;
      });

      afterEach(() => {
        nock.cleanAll();
      });

      test('should return ENDED status when timeO2End is present', async () => {
        const mockResponse = {
          data: {
            timeO2End: '2023-01-01T00:00:00Z',
          },
        };

        nock(VALID_CONFIG.bookkeeping.url).get(runsPathPattern).reply(200, mockResponse);
        const { runStatus } = await bkpService.retrieveRunInformation(123);
        strictEqual(runStatus, RunStatus.ENDED);
      });

      test('should return run information when data is present', async () => {
        const mockResponse = {
          data: {
            startTime: 1,
            endTime: 2,
            definition: null,
            runQuality: 'good',
            lhcBeamMode: 'PHYSICS',
            detectorsQualities: [],
          },
        };

        nock(VALID_CONFIG.bookkeeping.url).get(runsPathPattern).reply(200, mockResponse);
        const {
          startTime,
          endTime,
          definition,
          runQuality,
          lhcBeamMode,
          detectorsQualities,
          runStatus,
        } = await bkpService.retrieveRunInformation(123);
        const data = { startTime, endTime, definition, runQuality, lhcBeamMode, detectorsQualities };

        deepStrictEqual(data, mockResponse.data);
        ok(Object.values(RunStatus).includes(runStatus));
      });

      test('should return ONGOING status when timeO2End is not present', async () => {
        const mockResponse = { data: { timeO2End: undefined } };

        nock(VALID_CONFIG.bookkeeping.url).get(runsPathPattern).reply(200, mockResponse);

        const { runStatus } = await bkpService.retrieveRunInformation(456);
        strictEqual(runStatus, RunStatus.ONGOING);
      });

      test('should return UNKNOWN status when no data is returned', async () => {
        nock(VALID_CONFIG.bookkeeping.url).get(runsPathPattern).reply(200, {});

        const { runStatus } = await bkpService.retrieveRunInformation(789);
        strictEqual(runStatus, RunStatus.UNKNOWN);
      });

      test('should return UNKNOWN status when request fails', async () => {
        nock(VALID_CONFIG.bookkeeping.url).get(runsPathPattern).reply(500);

        const { runStatus } = await bkpService.retrieveRunInformation(1010);
        strictEqual(runStatus, RunStatus.UNKNOWN);
      });

      test('should return NOT_FOUND status when request fails', async () => {
        nock(VALID_CONFIG.bookkeeping.url).get(runsPathPattern).reply(404, {
          errors: [
            {
              status: '404',
              title: 'Run with this run number (1010) could not be found',
            },
          ],
        });

        const { runStatus } = await bkpService.retrieveRunInformation(1010);
        strictEqual(runStatus, RunStatus.NOT_FOUND);
      });

      test('should return BOOKKEEPING_UNAVAILABLE status when service is not active', async () => {
        bkpService.active = false;

        const { runStatus } = await bkpService.retrieveRunInformation(123);
        strictEqual(runStatus, RunStatus.BOOKKEEPING_UNAVAILABLE);
      });
    });
  });
};
