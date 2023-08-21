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

import { StatusController } from './../../../lib/controllers/StatusController.js';

export const statusControllerTestSuite = async () => {
  describe('`getFrameworkInfo()` tests', () => {
    it('should successfully respond with framework information', async () => {
      const statusService = {
        retrieveFrameworkInfo: stub().resolves({
          qcg: {
            status: { ok: true },
            version: '0.0.1',
          },
          ccdb: {
            status: { ok: false, message: 'Something went wrong here' },
          },
        }),
      };
      const statusController = new StatusController(statusService);
      const res = {
        status: stub().returnsThis(),
        json: stub(),
      };
      await statusController.getFrameworkInfo({}, res);

      const result = {
        qcg: { status: { ok: true }, version: '0.0.1' },
        ccdb: { status: { ok: false, message: 'Something went wrong here' } },
      };
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(result));
    });
    it('should respond with error if service failed to retrieve information', async () => {
      const statusService = {
        retrieveFrameworkInfo: stub().throws(new Error('Service could not retrieve status')),
      };
      const statusController = new StatusController(statusService);
      const res = {
        status: stub().returnsThis(),
        json: stub(),
      };
      await statusController.getFrameworkInfo({}, res);

      assert.ok(res.status.calledWith(503));
      assert.ok(res.json.calledWith({ message: 'Service could not retrieve status' }));
    });
  });

  describe('`getQCGStatus()` tests', () => {
    it('should successfully respond with result JSON with its status and specified version', () => {
      const statusService = {
        retrieveOwnStatus: stub().returns({
          status: { ok: true },
          version: '0.0.1',
        }),
      };
      const statusController = new StatusController(statusService);
      const res = {
        status: stub().returnsThis(),
        json: stub(),
      };
      statusController.getQCGStatus({}, res);

      const result = { status: { ok: true }, version: '0.0.1' };
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(result));
    });
  });
};
