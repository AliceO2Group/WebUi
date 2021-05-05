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

const assert = require('assert');
const nock = require('nock');
const sinon = require('sinon');
const StatusService = require('../../lib/services/StatusService.js');


describe('StatusService test suite', () => {
  describe('Test StatusService initialization', () => {
    it('should successfully initialize consul with "undefined" configuration', () => {
      const config = {http: {hostname: 'local', port: 8080}};
      const status = new StatusService(config, undefined, undefined);
      assert.deepStrictEqual(status.config, config);
    });
  });

  describe('Test Consul Status', async () => {
    let consulService;
    const config = {consul: {hostname: 'local', port: 8081}};
    const expectedInfo = config.consul;
    beforeEach(() => consulService = {});

    it('should successfully retrieve status and info about Consul that it is running', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().resolves('localhost:8550');
      const status = new StatusService(config, {}, consulService);
      const consulStatus = await status.getConsulStatus();

      expectedInfo.status = {ok: true};
      assert.deepStrictEqual(consulStatus, expectedInfo);
    });

    it('should successfully retrieve status and info about Consul that it is not running', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().rejects('Unable to query Consul');
      const status = new StatusService(config, {}, consulService);
      const consulStatus = await status.getConsulStatus();

      expectedInfo.status = {ok: false, message: 'Unable to query Consul'};
      assert.deepStrictEqual(consulStatus, expectedInfo);
    });

    it('should successfully return that service was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const consulStatus = await status.getConsulStatus();
      const expected = {status: {ok: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(consulStatus, expected);
    });
  });

  describe('Test AliECS Status', async () => {
    let ctrlService;
    const config = {grpc: {hostname: 'local', port: 8081}};
    const expectedInfo = config.grpc;
    beforeEach(() => ctrlService = {});

    it('should successfully retrieve status and info about AliECS that it is running', async () => {
      ctrlService.getAliECSInfo = sinon.stub().resolves({version: '0.20'});
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.getAliEcsCoreStatus();

      expectedInfo.status = {ok: true};
      expectedInfo.version = '0.20';
      assert.deepStrictEqual(coreStatus, expectedInfo);
    });

    it('should successfully retrieve status and info about AliECS that it is not running', async () => {
      ctrlService.getAliECSInfo = sinon.stub().rejects('Unable to query Core');
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.getAliEcsCoreStatus();

      expectedInfo.status = {ok: false, message: 'Unable to query Core'};
      assert.deepStrictEqual(coreStatus, expectedInfo);
    });

    it('should successfully return that service was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, ctrlService, {});
      const coreStatus = await status.getAliEcsCoreStatus();
      const expected = {status: {ok: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(coreStatus, expected);
    });
  });

  describe('Test GUI Status', async () => {
    const config = {http: {hostname: 'local', port: 8081}};
    const expectedInfo = config.http;

    it('should successfully retrieve status and info about AliECS GUI that it is running', async () => {
      const status = new StatusService(config, {}, {});
      const guiStatus = status.getGuiStatus();

      expectedInfo.status = {ok: true};
      delete guiStatus.version;
      assert.deepStrictEqual(guiStatus, expectedInfo);
    });

    it('should successfully return that service was not configured if GUI conf is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const guiStatus = status.getGuiStatus();
      delete guiStatus.version;
      const expected = {status: {ok: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(guiStatus, expected);
    });
  });

  describe('Test Grafana Status', async () => {
    const config = {grafana: {port: 8082}, http: {hostname: 'localh'}};
    const expectedInfo = {hostname: 'localh', port: 8082};

    it('should successfully retrieve status and info about Grafana that it is running', async () => {
      const status = new StatusService(config, {}, {});
      const grafanaStatus = await status.getGrafanaStatus();
      nock(`http://${config.http.hostname}:${config.grafana.port}`)
        .get('/api/health')
        .reply(200, {});
      expectedInfo.status = {ok: true};
      assert.deepStrictEqual(grafanaStatus, expectedInfo);
    });

    it('should successfully retrieve status and info about AliECS that it is not running', async () => {
      const status = new StatusService(config, {}, {});
      const grafanaStatus = await status.getGrafanaStatus();
      nock(`http://${config.http.hostname}:${config.grafana.port}`)
        .get('/api/health')
        .replyWithError('Unable to connect');
      expectedInfo.status = {ok: false, message: 'Error: Unable to connect'};
      assert.deepStrictEqual(grafanaStatus, expectedInfo);
    });

    it('should successfully return that service was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const grafanaStatus = await status.getGrafanaStatus();
      const expected = {status: {ok: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(grafanaStatus, expected);
    });
  });

  describe('Test Kafka Status', async () => {
    const config = {kafka: {port: 8083, hostname: 'localhost'}};
    const expectedInfo = {hostname: 'localhost', port: 8083};

    it('should successfully retrieve status and info about Kafka that it is running', async () => {
      const status = new StatusService(config, {}, {});
      const kafkaStatus = await status.getKafkaStatus();
      nock(`http://${config.kafka.hostname}:${config.kafka.port}`)
        .get('/api/health')
        .reply(200, {});
      expectedInfo.status = {ok: true};
      assert.deepStrictEqual(kafkaStatus, expectedInfo);
    });

    it('should successfully retrieve status and info about Kafka that it is not running', async () => {
      const status = new StatusService(config, {}, {});
      const kafkaStatus = await status.getKafkaStatus();
      nock(`http://${config.kafka.hostname}:${config.kafka.port}`)
        .get('/api/health')
        .replyWithError('Unable to connect');
      expectedInfo.status = {ok: false, message: 'Error: Unable to connect'};
      assert.deepStrictEqual(kafkaStatus, expectedInfo);
    });

    it('should successfully return that service was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const kafkaStatus = await status.getKafkaStatus();
      const expected = {status: {ok: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(kafkaStatus, expected);
    });
  });

  after(nock.cleanAll)
});
