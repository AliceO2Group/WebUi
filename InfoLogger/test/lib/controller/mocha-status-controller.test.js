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
/* eslint-disable max-len */

const sinon = require('sinon');
const assert = require('assert');
const config = require('./../../test-config.js');

const { StatusController } = require('./../../../lib/controller/StatusController.js');

describe('Status Service test suite', () => {
  config.mysql = {
    host: 'localhost',
    port: 6103,
    database: 'INFOLOGGER'
  };
  describe('Creating a new StatusController instance', () => {
    it('should successfully initialize StatusController', () => {
      assert.doesNotThrow(() => new StatusController({hostname: 'localhost', port: 8080}, {}));
    });
  });

  describe('`getProjectInfo()` tests', () => {
    it('should successfully return ilg info even if version is missing', () => {
      const statusController = new StatusController(config, undefined);
      const info = {hostname: 'localhost', port: 8080, status: {ok: true}, name: 'TST', clients: -1};
      assert.deepStrictEqual(statusController.getProjectInfo(), info);
    });

    it('should successfully return ilg version even if http configuration is missing', () => {
      const statusController = new StatusController({}, {version: '1.9.2'});
      const info = {version: '1.9.2', clients: -1};
      assert.deepStrictEqual(statusController.getProjectInfo(), info);
    });

    it('should successfully add project version if package.json was provided', () => {
      const statusController = new StatusController(config, {version: '1.9.2'});
      const info = {hostname: 'localhost', port: 8080, status: {ok: true}, version: '1.9.2', name: 'TST', clients: -1};
      assert.deepStrictEqual(statusController.getProjectInfo(), info);
    });
  });

  describe('`getLiveSourceStatus()` tests', () => {
    it('should successfully return InfoLogger Server info with status ok false if live source is missing', () => {
      const statusController = new StatusController(config, undefined);
      const info = {host: 'localhost', port: 6102, status: {ok: false, message: 'Unable to connect to InfoLogger Server'}};
      assert.deepStrictEqual(statusController._getLiveSourceStatus(config.infoLoggerServer), info);
    });

    it('should successfully return InfoLogger Server info with status ok when live source is present', () => {
      const statusController = new StatusController(config, undefined);
      statusController.liveSource = {isAvailable: true, onconnect: () => true};

      const info = {host: 'localhost', port: 6102, status: {ok: true}};
      assert.deepStrictEqual(statusController._getLiveSourceStatus(config.infoLoggerServer), info);
    });
  });

  describe('`getDataSourceStatus()` tests', () => {
    it('should successfully return mysql info with status ok false if data source is missing', async () => {
      const statusController = new StatusController(config, undefined);
      const info = {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: false, message: 'There was no data source set up'}};
      const mysql = await statusController.getDataSourceStatus(config.mysql);
      assert.deepStrictEqual(mysql, info);
    });

    it('should successfully return mysql info with status ok true when data source is present and connected', async () => {
      const statusController = new StatusController(config, undefined);
      const info = {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: true}};

      const dataSource = {
        isConnectionUpAndRunning: sinon.stub().resolves()
      }
      statusController.querySource = dataSource;
      const mysql = await statusController.getDataSourceStatus(config.mysql);
      assert.deepStrictEqual(mysql, info);
    });

    it('should successfully return mysql info with status ok false when data source is present but it is not connected', async () => {
      const statusController = new StatusController(config, undefined);
      const info = {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: false, message: 'Could not connect'}};

      const dataSource = {
        isConnectionUpAndRunning: sinon.stub().rejects(new Error('Could not connect'))
      }
      statusController.querySource = dataSource;
      const mysql = await statusController.getDataSourceStatus(config.mysql);
      assert.deepStrictEqual(mysql, info);
    });
  });

  describe('`frameworkInfo()` tests', () => {
    it('should successfully send response with built JSON information', async () => {
      const statusController = new StatusController(config, undefined);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      await statusController.frameworkInfo(undefined, res);

      const info = {
        'infoLogger-gui': {hostname: 'localhost', port: 8080, status: {ok: true}, name: 'TST', clients: -1},
        mysql: {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: false, message: 'There was no data source set up'}},
        infoLoggerServer: {host: 'localhost', port: 6102, status: {ok: false, message: 'Unable to connect to InfoLogger Server'}}
      };

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(info));
    });
  });

  describe('`getILGStatus()` tests', () => {
    it('should successfully send response with JSON information about ILG', async () => {
      const statusController = new StatusController(config, undefined);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      await statusController.getILGStatus(undefined, res);

      const info = {status: {ok: true}, clients: -1};

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(info));
    });
  });
});
