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

const sinon = require('sinon');
const assert = require('assert');
const config = require('../../test-config.js');

const StatusController = require('../../../lib/controllers/StatusController.js');

describe('Status Service test suite', () => {
  describe('Creating a new StatusController instance', () => {
    it('should throw an error if configuration object is not provided', () => {
      assert.throws(() => new StatusController(), new Error('Empty Framework configuration'));
      assert.throws(() => new StatusController(null), new Error('Empty Framework configuration'));
      assert.throws(() => new StatusController(undefined), new Error('Empty Framework configuration'));
    });

    it('should successfully initialize StatusController', () => {
      assert.doesNotThrow(() => new StatusController({ hostname: 'localhost', port: 8080 }, {}));
    });
  });

  describe('`getDataConnectorStatus()` tests', () => {
    let statusService;
    before(() => {
      statusService = new StatusController(config);
    });
    it('successfully return status with error if no data connector was set', async () => {
      const response = await statusService.getDataConnectorStatus();
      assert.deepStrictEqual(response, { ok: false, message: 'Data connector was not configured' });
    });
    it('successfully return status with error if data connector threw an error', async () => {
      const dataConnector = {
        isConnectionUp: sinon.stub().rejects(new Error('Unable to retrieve status of data store')),
      };
      statusService.setDataConnector(dataConnector);
      const response = await statusService.getDataConnectorStatus();
      assert.deepStrictEqual(response, { ok: false, message: 'Unable to retrieve status of data store' });
    });
    it('successfully return status with ok if data connector passed checks', async () => {
      const dataConnector = {
        isConnectionUp: sinon.stub().resolves(),
      };
      statusService.setDataConnector(dataConnector);
      const response = await statusService.getDataConnectorStatus();
      assert.deepStrictEqual(response, { ok: true });
    });
  });

  describe('`getLiveModeConnectorStatus()` tests', () => {
    let statusService;
    before(() => statusService = new StatusController(config));
    it('successfully return status with error if no live connector was set', async () => {
      const response = await statusService.getLiveModeConnectorStatus();
      assert.deepStrictEqual(response, { ok: false, message: 'Live Mode was not configured' });
    });
    it('successfully return status with error if live connector threw an error', async () => {
      const onlineConnector = {
        getConsulLeaderStatus: sinon.stub().rejects(new Error('Unable to retrieve status of live mode')),
      };
      statusService.setLiveModeConnector(onlineConnector);
      const response = await statusService.getLiveModeConnectorStatus();
      assert.deepStrictEqual(response, { ok: false, message: 'Unable to retrieve status of live mode' });
    });
    it('successfully return status ok if live live connector passed checks', async () => {
      const onlineConnector = {
        getConsulLeaderStatus: sinon.stub().resolves(),
      };
      statusService.setLiveModeConnector(onlineConnector);
      const response = await statusService.getLiveModeConnectorStatus();
      assert.deepStrictEqual(response, { ok: true });
    });
  });

  describe('`getFrameworkInfo()` tests', () => {
    it('successfully build result JSON with framework information', async () => {
      const statusService = new StatusController(config);
      const dataConnector = { isConnectionUp: sinon.stub().resolves() };
      const onlineConnector = { getConsulLeaderStatus: sinon.stub().rejects(new Error('Live mode was not configured')) };
      statusService.setDataConnector(dataConnector);
      statusService.setLiveModeConnector(onlineConnector);
      const response = await statusService.getFrameworkInfo();
      const result = {
        qcg: { hostname: 'localhost', port: 8181, status: { ok: true } },
        ccdb: {
          hostname: 'ccdb', port: 8500, prefix: 'test', status: { ok: true },
        },
        consul: { hostname: 'localhost', port: 8500, status: { ok: false, message: 'Live mode was not configured' } },
        quality_control: { version: '0.19.5-1' },
      };
      assert.deepStrictEqual(response, result);
    });
  });

  describe('`frameworkInfo()` tests', () => {
    it('successfully send back result JSON with framework information', async () => {
      const statusService = new StatusController(config);
      const dataConnector = { isConnectionUp: sinon.stub().resolves() };
      const onlineConnector = { getConsulLeaderStatus: sinon.stub().rejects(new Error('Live mode was not configured')) };
      statusService.setDataConnector(dataConnector);
      statusService.setLiveModeConnector(onlineConnector);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      await statusService.frameworkInfo({}, res);

      const result = {
        qcg: { hostname: 'localhost', port: 8181, status: { ok: true } },
        ccdb: {
          hostname: 'ccdb', port: 8500, prefix: 'test', status: { ok: true },
        },
        consul: { hostname: 'localhost', port: 8500, status: { ok: false, message: 'Live mode was not configured' } },
        quality_control: { version: '0.19.5-1' },
      };
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(result));
    });
  });

  describe('`getQCGStatus()` tests', () => {
    it('successfully send back result JSON with framework information', async () => {
      const statusService = new StatusController(config);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      await statusService.getQCGStatus({}, res);

      const result = { hostname: 'localhost', port: 8181, status: { ok: true } };
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(result));
    });
  });
});
