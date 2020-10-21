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
const config = require('../test-config.js');

const StatusService = require('../../lib/StatusService.js');

describe('Status Service test suite', () => {
  describe('Creating a new StatusService instance', () => {
    it('should throw an error if configuration object is not provided', () => {
      assert.throws(() => new StatusService(), new Error('Empty Framework configuration'));
      assert.throws(() => new StatusService(null), new Error('Empty Framework configuration'));
      assert.throws(() => new StatusService(undefined), new Error('Empty Framework configuration'));
    });
    it('should successfully initialize StatusService', () => {
      assert.doesNotThrow(() => new StatusService({hostname: 'localhost', port: 8080}, {}));
    });
  });

  describe('`getProjectInfo()` tests', () => {
    it('should successfully return ilg info even if version is missing', () => {
      const statusService = new StatusService(config, undefined);
      const info = {hostname: 'localhost', port: 8080, status: {ok: true}};
      assert.deepStrictEqual(statusService.getProjectInfo(), info);
    });
    it('should successfully return ilg version even if http configuration is missing', () => {
      const statusService = new StatusService({}, {version: '1.9.2'});
      const info = {version: '1.9.2'};
      assert.deepStrictEqual(statusService.getProjectInfo(), info);
    });
    it('should successfully add project version if package.json was provided', () => {
      const statusService = new StatusService(config, {version: '1.9.2'});
      const info = {hostname: 'localhost', port: 8080, status: {ok: true}, version: '1.9.2'};
      assert.deepStrictEqual(statusService.getProjectInfo(), info);
    });
  });

  describe('`getLiveSourceStatus()` tests', () => {
    it('should successfully return InfoLogger Server info with status ok false if live source is missing', () => {
      const statusService = new StatusService(config, undefined);
      const info = {host: 'localhost', port: 6102, status: {ok: false, message: 'There was no live source set up'}};
      assert.deepStrictEqual(statusService.getLiveSourceStatus(config.infoLoggerServer), info);
    });
    it('should successfully return InfoLogger Server info with status ok when live source is present', () => {
      const statusService = new StatusService(config, undefined);
      statusService.setLiveSource({onconnect: () => true});

      const info = {host: 'localhost', port: 6102, status: {ok: true}};
      assert.deepStrictEqual(statusService.getLiveSourceStatus(config.infoLoggerServer), info);
    });
  });

  describe('`getDataSourceStatus()` tests', () => {
    it('should successfully return mysql info with status ok false if data source is missing', async () => {
      const statusService = new StatusService(config, undefined);
      const info = {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: false, message: 'There was no data source set up'}};
      const mysql = await statusService.getDataSourceStatus(config.mysql);
      assert.deepStrictEqual(mysql, info);
    });
    it('should successfully return mysql info with status ok true when data source is present and connected', async () => {
      const statusService = new StatusService(config, undefined);
      const info = {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: true}};

      const dataSource = {
        isConnectionUpAndRunning: sinon.stub().resolves()
      }
      statusService.setQuerySource(dataSource);
      const mysql = await statusService.getDataSourceStatus(config.mysql);
      assert.deepStrictEqual(mysql, info);
    });
    it('should successfully return mysql info with status ok false when data source is present but it is not connected', async () => {
      const statusService = new StatusService(config, undefined);
      const info = {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: false, message: 'Could not connect'}};

      const dataSource = {
        isConnectionUpAndRunning: sinon.stub().rejects(new Error('Could not connect'))
      }
      statusService.setQuerySource(dataSource);
      const mysql = await statusService.getDataSourceStatus(config.mysql);
      assert.deepStrictEqual(mysql, info);
    });
  });

  describe('`frameworkInfo()` tests', () => {
    it('should successfully send response with built JSON information', async () => {
      const statusService = new StatusService(config, undefined);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      await statusService.frameworkInfo(undefined, res);

      const info = {
        'infoLogger-gui': {hostname: 'localhost', port: 8080, status: {ok: true}},
        mysql: {host: 'localhost', port: 6103, database: 'INFOLOGGER', status: {ok: false, message: 'There was no data source set up'}},
        infoLoggerServer: {host: 'localhost', port: 6102, status: {ok: false, message: 'There was no live source set up'}}
      };

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(info));
    });
  });
});
