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

/* eslint-disable require-jsdoc */

import { stub } from 'sinon';
import { deepStrictEqual } from 'node:assert';
import { suite, test, before } from 'node:test';

import { StatusService } from './../../../lib/services/Status.service.js';

export const statusServiceTestSuite = async () => {
  suite('`retrieveDataServiceStatus()` tests', () => {
    let statusService;
    before(() => {
      statusService = new StatusService({ version: '0.1.1' });
    });
    test('should return status in error is data connector throws error', async () => {
      statusService.dataService = {
        getVersion: stub().throws(new Error('Service is currently unavailable')),
      };
      const result = await statusService.retrieveDataServiceStatus();
      deepStrictEqual(result, { status: { ok: false, message: 'Service is currently unavailable' } });
    });
    test('should successfully return status ok if data connector passed checks', async () => {
      statusService.dataService = {
        getVersion: stub().resolves({ version: '0.0.1' }),
      };
      const response = await statusService.retrieveDataServiceStatus();
      deepStrictEqual(response, { status: { ok: true }, version: '0.0.1' });
    });
  });

  suite('`retrieveServiceStatus()` tests', () => {
    test('should successfully build an object with framework information from all used sources', async () => {
      const statusService = new StatusService();
      statusService.dataService = { getVersion: stub().resolves({ version: '0.0.1-beta' }) };

      const statusInfo = await Promise.all([
        statusService.retrieveServiceStatus('qcg'),
        statusService.retrieveServiceStatus('qc'),
        statusService.retrieveServiceStatus('ccdb'),
      ]);

      const expectedResults = [
        { version: '-', status: { ok: true }, clients: -1 },
        { status: { ok: true }, version: 'Not part of an FLP deployment' },
        { status: { ok: true }, version: '0.0.1-beta' },
      ];

      deepStrictEqual(statusInfo, expectedResults);
    });

    suite('`retrieveQcVersion()` tests', () => {
      test('should return message that is not part of an FLP deployment', async () => {
        const statusService = new StatusService();
        const response = await statusService.retrieveQcVersion();
        const result = { status: { ok: true }, version: 'Not part of an FLP deployment' };
        deepStrictEqual(response, result);
      });
    });
  });

  suite('`retrieveOwnStatus()` tests', () => {
    test('should successfully return an object with status and version of itself', async () => {
      const statusService = new StatusService({ version: '0.0.1' });
      const result = statusService.retrieveOwnStatus();

      deepStrictEqual(result, {
        status: { ok: true },
        version: '0.0.1',
        clients: -1,
      });
    });

    test('should successfully return an object with status and no version of itself', async () => {
      const statusService = new StatusService();
      const result = statusService.retrieveOwnStatus();

      deepStrictEqual(result, {
        status: { ok: true },
        version: '-',
        clients: -1,
      });
    });
  });
};
