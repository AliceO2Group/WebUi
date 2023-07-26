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
/* eslint-disable max-len */

import { stub } from 'sinon';
import assert from 'assert';

import { StatusService } from './../../../lib/services/Status.service.js';

export const statusServiceTestSuite = async () => {
  describe('`retrieveDataServiceStatus()` tests', () => {
    let statusService;
    before(() => {
      statusService = new StatusService({ version: '0.1.1' });
    });
    it('should return status in error is data connector throws error', async () => {
      statusService.dataService = {
        retrieveVersion: stub().throws(new Error('Service is currently unavailable')),
      };
      const result = await statusService.retrieveDataServiceStatus();
      assert.deepStrictEqual(result, { status: { ok: false, message: 'Service is currently unavailable' } });
    });
    it('should successfully return status ok if data connector passed checks', async () => {
      statusService.dataService = {
        retrieveVersion: stub().resolves({ version: '0.0.1' }),
      };
      const response = await statusService.retrieveDataServiceStatus();
      assert.deepStrictEqual(response, { status: { ok: true }, version: '0.0.1' });
    });
  });

  describe('`retrieveOnlineServiceStatus()` tests', () => {
    let statusService;
    before(() => {
      statusService = new StatusService();
    });
    it('should successfully return status if no online service was configured with customized version', async () => {
      const response = await statusService.retrieveOnlineServiceStatus();
      assert.deepStrictEqual(response, { status: { ok: true }, version: 'Live Mode was not configured' });
    });
    it('should return status in error if online service threw an error', async () => {
      statusService.onlineService = {
        getConsulLeaderStatus: stub().rejects(new Error('Unable to retrieve status of live mode')),
      };
      const response = await statusService.retrieveOnlineServiceStatus();
      assert.deepStrictEqual(response, { status: { ok: false, message: 'Unable to retrieve status of live mode' } });
    });
    it('should successfully return status ok if online service passed checks', async () => {
      statusService.onlineService = {
        getConsulLeaderStatus: stub().resolves(),
      };
      const response = await statusService.retrieveOnlineServiceStatus();
      assert.deepStrictEqual(response, { status: { ok: true } });
    });
  });

  describe('`retrieveFrameworkInfo()` tests', () => {
    it('should successfully build an object with framework information from all used sources', async () => {
      const statusService = new StatusService();
      statusService.dataService = { retrieveVersion: stub().resolves({ version: '0.0.1-beta' }) };
      statusService.onlineService = { getConsulLeaderStatus: stub().rejects(new Error('Online mode failed to retrieve')) };

      const response = await statusService.retrieveFrameworkInfo();
      const result = {
        qcg: { version: '-', status: { ok: true } },
        qc: { status: { ok: true }, version: 'Not part of an FLP deployment' },
        data_service_ccdb: { status: { ok: true }, version: '0.0.1-beta' },
        online_service_consul: { status: { ok: false, message: 'Online mode failed to retrieve' } },
      };
      assert.deepStrictEqual(response, result);
    });

    describe('`retrieveQcVersion()` tests', () => {
      it('should return message that is not part of an FLP deployment', async () => {
        const statusService = new StatusService();
        const response = await statusService.retrieveQcVersion();
        const result = { status: { ok: true }, version: 'Not part of an FLP deployment' };
        assert.deepStrictEqual(response, result);
      });
    });
  });

  describe('`retrieveOwnStatus()` tests', () => {
    it('should successfully return an object with status and version of itself', async () => {
      const statusService = new StatusService({ version: '0.0.1' });
      const res = {
        status: stub().returnsThis(),
        json: stub(),
      };
      const result = statusService.retrieveOwnStatus({}, res);

      assert.deepStrictEqual(result, {
        status: { ok: true },
        version: '0.0.1',
      });
    });

    it('should successfully return an object with status and no version of itself', async () => {
      const statusService = new StatusService();
      const res = {
        status: stub().returnsThis(),
        json: stub(),
      };
      const result = statusService.retrieveOwnStatus({}, res);

      assert.deepStrictEqual(result, {
        status: { ok: true },
        version: '-',
      });
    });
  });
};
