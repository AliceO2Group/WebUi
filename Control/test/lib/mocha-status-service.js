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
const KafkaConnector = require('@aliceo2/web-ui').KafkaConnector;

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

      expectedInfo.status = {ok: true, configured: true};
      assert.deepStrictEqual(consulStatus, expectedInfo);
    });

    it('should successfully retrieve status and info about Consul that it is not running', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().rejects('Unable to query Consul');
      const status = new StatusService(config, {}, consulService);
      const consulStatus = await status.getConsulStatus();

      expectedInfo.status = {ok: false, configured: true, message: 'Unable to query Consul'};
      assert.deepStrictEqual(consulStatus, expectedInfo);
    });

    it('should successfully return consul was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const consulStatus = await status.getConsulStatus();
      const expected = {status: {ok: false, configured: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(consulStatus, expected);
    });
  });

  describe('Test AliECS Status', async () => {
    let ctrlService;
    const config = {grpc: {hostname: 'local', port: 8081, timeout: 20, maxMessageLength: 50}};
    const expectedInfo = {
      url: `${config.grpc.hostname}:${config.grpc.port}`,
      timeout: config.grpc.timeout,
      maxMessageLength: config.grpc.maxMessageLength
    };
    beforeEach(() => ctrlService = {});

    it('should successfully retrieve status and info about AliECS that it is running', async () => {
      ctrlService.getAliECSInfo = sinon.stub().resolves({version: '0.20'});
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.getAliEcsCoreStatus();

      expectedInfo.status = {ok: true, configured: true};
      expectedInfo.version = '0.20';
      assert.deepStrictEqual(coreStatus, expectedInfo);
    });

    it('should successfully retrieve status and info about AliECS that it is not running', async () => {
      ctrlService.getAliECSInfo = sinon.stub().rejects('Unable to query Core');
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.getAliEcsCoreStatus();

      expectedInfo.status = {ok: false, configured: true, message: 'Unable to query Core'};
      delete expectedInfo.version;
      assert.deepStrictEqual(coreStatus, expectedInfo);
    });

    it('should successfully return that AliECS was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, ctrlService, {});
      const coreStatus = await status.getAliEcsCoreStatus();
      const expected = {status: {ok: false, configured: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(coreStatus, expected);
    });
  });

  describe('Test GUI Status', async () => {
    const config = {http: {hostname: 'local', port: 8081}};
    const expectedInfo = config.http;

    it('should successfully retrieve status and info about AliECS GUI that it is running', async () => {
      const status = new StatusService(config, {}, {});
      const guiStatus = status.getGuiStatus();

      expectedInfo.status = {ok: true, configured: true};
      delete guiStatus.version;
      assert.deepStrictEqual(guiStatus, expectedInfo);
    });

    it('should successfully return that GUI was not configured if GUI conf is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const guiStatus = status.getGuiStatus();
      delete guiStatus.version;
      const expected = {status: {ok: false, configured: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(guiStatus, expected);
    });
  });

  describe('Test Grafana Status', async () => {
    const config = {grafana: {url: 'http://localhost:8084'}};
    const expectedInfo = {protocol: 'http:', hostname: 'localhost', port: '8084'};

    it('should successfully retrieve status and info about Grafana that it is running', async () => {
      const status = new StatusService(config, {}, {});
      const grafanaStatus = await status.getGrafanaStatus();
      nock(config.grafana.url)
        .get('/api/health')
        .reply(200, {});
      assert.deepStrictEqual(grafanaStatus.status, {ok: true, configured: true});
      assert.strictEqual(grafanaStatus.url, `http://${expectedInfo.hostname}:${expectedInfo.port}`);

    });

    it('should successfully retrieve status and info about Grafana that it is not running', async () => {
      const status = new StatusService(config, {}, {});
      const grafanaStatus = await status.getGrafanaStatus();
      nock(config.grafana.url)
        .get('/api/health')
        .replyWithError('Unable to connect');
      assert.deepStrictEqual(grafanaStatus.status, {ok: false, configured: true, message: 'Error: Unable to connect'});
    });

    it('should successfully return that grafana was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const grafanaStatus = await status.getGrafanaStatus();
      assert.deepStrictEqual(grafanaStatus.status, {ok: false, configured: false, message: 'This service was not configured'});
    });
  });

  describe('Test Kafka Status', async () => {
    const config = {kafka: {brokers: ['localhost:8083']}};
    const expectedInfo = {brokers: ['localhost:8083']};

    it('should successfully retrieve status and info about Kafka that it is not running', async () => {
      const status = new StatusService(config, {}, {});
      const kafkaStatus = await status.getKafkaStatus(new KafkaConnector(config.kafka));
      expectedInfo.status = {ok: false, configured: true, message: 'KafkaJSNumberOfRetriesExceeded'};
      assert.deepStrictEqual(kafkaStatus, expectedInfo);
    }).timeout(5000);

    it('should successfully return that Kafka was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const kafkaStatus = await status.getKafkaStatus(new KafkaConnector());
      const expected = {status: {ok: false, configured: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(kafkaStatus, expected);
    });
  });

  describe('Test AliECS Integrated Services Status', async () => {
    let ctrlService;
    const config = {grpc: {hostname: 'local', port: 8081}};
    beforeEach(() => ctrlService = {});

    it('should successfully retrieve status and info about AliECS services and add status field', async () => {
      const services = {
        services: {
          dcs: {connectionState: 'READY'},
          otherDcs: {connectionState: 'TRANSIENT_FAILURE'}
        }
      }
      ctrlService.getIntegratedServicesInfo = sinon.stub().resolves(services);
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.getIntegratedServicesInfo();

      const expServices = {
        dcs: {
          connectionState: 'READY'
        },
        otherDcs: {connectionState: 'TRANSIENT_FAILURE'}
      }
      assert.deepStrictEqual(coreStatus, expServices);
    });

    it('should successfully retrieve status and info about AliECS that it is not running', async () => {
      ctrlService.getIntegratedServicesInfo = sinon.stub().rejects('Unable to query Core');
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.getIntegratedServicesInfo();

      const expectedInfo = {
        all:
          {name: 'Integrated Services', connectionState: 'TRANSIENT_FAILURE', data: {message: 'Unable to query Core'}}
      };
      assert.deepStrictEqual(coreStatus, expectedInfo);
    });
  });

  describe('Test Apricot status', () => {
    let apricotService;
    const config = {apricot: {hostname: 'local', port: 8081, timeout: 20, maxMessageLength: 50}};
    const expectedInfo = {
      url: `${config.apricot.hostname}:${config.apricot.port}`,
      timeout: config.apricot.timeout,
      maxMessageLength: config.apricot.maxMessageLength
    };
    beforeEach(() => apricotService = {});

    it('should successfully retrieve status and info about Apricot that it is running', async () => {
      apricotService.getStatus = sinon.stub().resolves();
      const statusService = new StatusService(config, {}, {}, apricotService);
      const status = await statusService.getApricotStatus();

      expectedInfo.status = {ok: true, configured: true};
      assert.deepStrictEqual(status, expectedInfo);
    });

    it('should successfully retrieve status and info about Apricot that it is not running', async () => {
      apricotService.getStatus = sinon.stub().rejects('Unable to check status of Apricot');
      const statusService = new StatusService(config, {}, {}, apricotService);
      const status = await statusService.getApricotStatus();

      expectedInfo.status = {ok: false, configured: true, message: 'Unable to check status of Apricot'};
      assert.deepStrictEqual(status, expectedInfo);
    });

    it('should successfully return that AliECS was not configured if configuration is not provided', async () => {
      const statusService = new StatusService({}, apricotService, {});
      const status = await statusService.getApricotStatus();
      const expected = {status: {ok: false, configured: false, message: 'This service was not configured'}};
      assert.deepStrictEqual(status, expected);
    });
  });

  after(nock.cleanAll)
});
