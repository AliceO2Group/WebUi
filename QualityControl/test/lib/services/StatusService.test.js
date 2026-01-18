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

import { stub } from 'sinon';
import { deepStrictEqual } from 'node:assert';
import { suite, test, before } from 'node:test';

import { StatusService } from './../../../lib/services/Status.service.js';
import { config } from '../../config.js';
import { ServiceStatus } from '../../../common/library/enums/Status/serviceStatus.enum.js';

export const statusServiceTestSuite = async () => {
  suite('`retrieveDataServiceStatus()` tests', () => {
    let statusService = undefined;
    before(() => {
      statusService = new StatusService({ version: '0.1.1' });
    });
    test('should return status in error is data connector throws error', async () => {
      statusService.dataService = {
        getVersion: stub().throws(new Error('Service is currently unavailable')),
      };
      const result = await statusService.retrieveDataServiceStatus();
      deepStrictEqual(
        result,
        {
          name: 'CCDB',
          status: { ok: false, category: ServiceStatus.ERROR, message: 'Service is currently unavailable' },
          version: '',
          extras: {},
        },
      );
    });
    test('should successfully return status ok if data connector passed checks', async () => {
      statusService.dataService = {
        getVersion: stub().resolves({ version: '0.0.1' }),
      };
      const response = await statusService.retrieveDataServiceStatus();
      deepStrictEqual(response, {
        name: 'CCDB',
        status: { ok: true, category: ServiceStatus.SUCCESS },
        version: '0.0.1',
        extras: {},
      });
    });
  });

  suite('`retrieveServiceStatus()` tests', () => {
    test('should successfully build an object with framework information from all used sources', async () => {
      const statusService = new StatusService();
      statusService.dataService = { getVersion: stub().resolves({ version: '0.0.1-beta' }) };
      statusService.aliEcsSynchronizer = { status: ServiceStatus.SUCCESS };

      const statusInfo = await Promise.all([
        statusService.retrieveServiceStatus('qcg'),
        statusService.retrieveServiceStatus('qc'),
        statusService.retrieveServiceStatus('ccdb'),
        statusService.retrieveServiceStatus('kafka'),
      ]);

      const expectedResults = [
        {
          name: 'QCG',
          version: '',
          status: { ok: true, category: ServiceStatus.SUCCESS },
          extras: { clients: -1 },
        },
        {
          name: 'QC',
          status: { ok: false, category: ServiceStatus.NOT_CONFIGURED },
          version: 'Not part of an FLP deployment',
          extras: {},
        },
        {
          name: 'CCDB',
          status: { ok: true, category: ServiceStatus.SUCCESS },
          version: '0.0.1-beta',
          extras: {},
        },
        {
          name: 'kafka',
          status: { ok: true, category: ServiceStatus.SUCCESS },
          extras: {},
        },
      ];

      deepStrictEqual(statusInfo, expectedResults);
    });

    suite('`retrieveQcVersion()` tests', () => {
      test('should return message that is not part of an FLP deployment', async () => {
        const statusService = new StatusService();
        const response = await statusService.retrieveQcVersion();
        const result = {
          name: 'QC',
          status: { ok: false, category: ServiceStatus.NOT_CONFIGURED },
          version: 'Not part of an FLP deployment',
          extras: {},
        };
        deepStrictEqual(response, result);
      });
    });
  });

  suite('`retrieveOwnStatus()` tests', () => {
    test('should successfully return an object with status and version of itself', async () => {
      const statusService = new StatusService({ version: '0.0.1' });
      const result = statusService.retrieveOwnStatus();

      deepStrictEqual(result, {
        name: 'QCG',
        status: { ok: true, category: ServiceStatus.SUCCESS },
        version: '0.0.1',
        extras: {
          clients: -1,
        },
      });
    });

    test('should successfully return an object with status and no version of itself', async () => {
      const statusService = new StatusService();
      const result = statusService.retrieveOwnStatus();

      deepStrictEqual(result, {
        name: 'QCG',
        status: { ok: true, category: ServiceStatus.SUCCESS },
        version: '',
        extras: { clients: -1 },
      });
    });
  });

  suite('`retrieveKafkaServiceStatus()` tests', () => {
    test('marks Kafka service as healthy when synchronizer reports SUCCESS', async () => {
      const statusService = new StatusService();
      statusService.aliEcsSynchronizer = { status: ServiceStatus.SUCCESS };
      const result = statusService.retrieveKafkaServiceStatus();

      deepStrictEqual(result, {
        name: 'kafka',
        status: { ok: true, category: ServiceStatus.SUCCESS },
        extras: {},
      });
    });

    test('marks Kafka service as idle when synchronizer has not been queried', async () => {
      const statusService = new StatusService();
      statusService.aliEcsSynchronizer = { status: ServiceStatus.NOT_ASKED };
      const result = statusService.retrieveKafkaServiceStatus();

      deepStrictEqual(result, {
        name: 'kafka',
        status: { ok: false, category: ServiceStatus.NOT_ASKED },
        extras: {},
      });
    });

    test('marks Kafka service as unhealthy when synchronizer reports an error', async () => {
      const statusService = new StatusService();
      statusService.aliEcsSynchronizer = { status: ServiceStatus.ERROR, extraInfo: { message: 'test error' } };
      const result = statusService.retrieveKafkaServiceStatus();

      deepStrictEqual(result, {
        name: 'kafka',
        status: { ok: false, category: ServiceStatus.ERROR },
        extras: { message: 'test error' },
      });
    });

    test('marks Kafka service as initializing while synchronizer is loading', async () => {
      const statusService = new StatusService();
      statusService.aliEcsSynchronizer = { status: ServiceStatus.LOADING };
      const result = statusService.retrieveKafkaServiceStatus();

      deepStrictEqual(result, {
        name: 'kafka',
        status: { ok: false, category: ServiceStatus.LOADING },
        extras: {},
      });
    });

    test('marks Kafka service as not configured when no synchronizer is present', async () => {
      const statusService = new StatusService();
      const result = statusService.retrieveKafkaServiceStatus();

      deepStrictEqual(result, {
        name: 'kafka',
        status: { ok: false, category: ServiceStatus.NOT_CONFIGURED },
        extras: {},
      });
    });
  });

  suite('`retrieveServicesConfiguration()` tests', () => {
    test('should return bookkeeping configuration if bookkeeping service is active', () => {
      const serviceConfig = {
        bookkeeping: { url: config.bookkeeping.url },
      };
      const statusService = new StatusService({ version: '0.1.1' }, serviceConfig);

      statusService.bookkeepingService = { active: true };

      const result = statusService.retrieveServicesConfiguration();

      deepStrictEqual(result, {
        bookkeeping: {
          BASE_URL: config.bookkeeping.url,
          PARTIAL_RUN_DETAILS: '?page=run-detail&runNumber=',
        },
      });
    });
  });
};
