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

const assert = require('assert');
const nock = require('nock');
const sinon = require('sinon');
const {NotificationService} = require('@aliceo2/web-ui');

const {StatusService} = require('./../../../lib/services/Status.service.js');
const {RUNTIME_COMPONENTS} = require('./../../../lib/common/kvStore/runtime.enum.js');

describe('StatusService test suite', () => {
  describe('Test StatusService initialization', () => {
    it('should successfully initialize consul with "undefined" configuration', () => {
      const config = {http: {hostname: 'local', port: 8080}};
      const status = new StatusService(config, undefined, undefined);
      assert.deepStrictEqual(status.config, config);
    });
  });

  describe('Test Consul info retrieval via StatusService', async () => {
    let consulService;
    const config = {consul: {hostname: 'local', port: 8081}};
    const expectedInfo = {
      endpoint: 'local:8081',
      extras: {},
      name: 'Consul - KV Store',
    };
    beforeEach(() => consulService = {});

    it('should successfully retrieve status and info about Consul that it is running', async () => {
      consulService = {
        getConsulLeaderStatus: sinon.stub().resolves('localhost:8550'),
        hostname: 'local',
        port: 8081,
      };
      const status = new StatusService(config, {}, consulService);
      const consul = await status.getConsulAsComponent();

      expectedInfo.status = {ok: true, configured: true, isCritical: true};
      assert.deepStrictEqual(consul, expectedInfo);
    });

    it('should successfully retrieve status and info about Consul that it is not running', async () => {
      consulService = {
        getConsulLeaderStatus: sinon.stub().rejects('Unable to query Consul'),
      };
      const status = new StatusService({consul: {hostname: 'local', port: 8081}}, {}, consulService);
      const consul = await status.getConsulAsComponent();

      expectedInfo.status = {ok: false, configured: true, isCritical: true, message: 'Unable to query Consul'};
      assert.deepStrictEqual(consul, expectedInfo);
    });

    it('should successfully return consul was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, undefined)
      const consul = await status.getConsulAsComponent();
      const expected = {
        name: 'Consul - KV Store',
        status: {
          ok: false, configured: false, isCritical: true, message: 'This service was not configured'
        }
      };
      assert.deepStrictEqual(consul, expected);
    });
  });

  describe('Test AliECS Status retrieval via StatusService', async () => {
    let ctrlService;
    const config = {grpc: {hostname: 'local', port: 8081, timeout: 20, maxMessageLength: 50}};
    const expectedInfo = {
      endpoint: `${config.grpc.hostname}:${config.grpc.port}`,
      extras: {
        timeout: config.grpc.timeout,
        maxMessageLength: config.grpc.maxMessageLength
      },
      name: 'AliECS Core',
    };
    beforeEach(() => ctrlService = {
      coreConfig: {hostname: 'local', port: 8081, timeout: 20, maxMessageLength: 50}
    });

    it('should successfully retrieve status and info about AliECS that it is running', async () => {
      ctrlService.getAliECSInfo = sinon.stub().resolves({version: '0.20'});
      const status = new StatusService(config, ctrlService, {});
      const core = await status.retrieveAliEcsCoreInfo();

      expectedInfo.status = {ok: true, configured: true, isCritical: true};
      expectedInfo.version = '0.20';
      assert.deepStrictEqual(core, expectedInfo);
    });

    it('should successfully retrieve status and info about AliECS that it is not running', async () => {
      ctrlService.getAliECSInfo = sinon.stub().rejects('Unable to query Core');
      const status = new StatusService(config, ctrlService, {});
      const core = await status.retrieveAliEcsCoreInfo();

      expectedInfo.status = {ok: false, configured: true, isCritical: true, message: 'Unable to query Core'};
      delete expectedInfo.version;
      assert.deepStrictEqual(core, expectedInfo);
    });

    it('should successfully return that AliECS was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, undefined, {});
      const core = await status.retrieveAliEcsCoreInfo();
      const expected = {
        extras: {},
        name: 'AliECS Core',
        status: {
          ok: false, configured: false, isCritical: true, message: 'This service was not configured'
        }
      };
      assert.deepStrictEqual(core, expected);
    });
  });

  describe('Test GUI Status retrieval via StatusService', async () => {
    const config = {http: {hostname: 'local', port: 8081}};
    const expectedInfo = {name: 'AliECS GUI', clients: 0};

    it('should successfully retrieve status and info about AliECS GUI that it is running', async () => {
      const status = new StatusService(config, {}, {});
      const guiStatus = status.getGuiStatus();

      expectedInfo.status = {ok: true, configured: true, isCritical: true};
      delete guiStatus.version;
      assert.deepStrictEqual(guiStatus, expectedInfo);
    });
  });

  describe('Test Grafana Status', async () => {
    const config = {grafana: {url: 'http://localhost:8084'}};
    const expectedInfo = {protocol: 'http:', hostname: 'localhost', port: '8084', name: 'Grafana - Monitoring'};

    it('should successfully retrieve status and info about Grafana that it is running', async () => {
      const status = new StatusService(config, {}, {});
      nock(config.grafana.url)
        .get('/api/health')
        .reply(200, {});
      const grafana = await status.getGrafanaAsComponent();

      assert.deepStrictEqual(grafana.status, {ok: true, configured: true, isCritical: false});
      assert.strictEqual(grafana.endpoint, `http://${expectedInfo.hostname}:${expectedInfo.port}`);
    });

    it('should successfully retrieve status and info about Grafana that it is not running', async () => {
      const status = new StatusService(config, {}, {});
      nock(config.grafana.url)
        .get('/api/health')
        .replyWithError('Unable to connect');
      const grafana = await status.getGrafanaAsComponent();

      assert.deepStrictEqual(grafana.status, {
        ok: false, configured: true, isCritical: false, message: 'Error: Unable to connect'
      });
    });

    it('should successfully return that grafana was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {});
      const grafana = await status.getGrafanaAsComponent();
      assert.deepStrictEqual(grafana.status, {
        ok: false, configured: false, isCritical: false, message: 'This service was not configured'
      });
    });
  });

  describe('Test Kafka Status', async () => {
    const config = {kafka: {endpoint: 'localhost:8080', brokers: ['localhost:8083']}};
    const expectedInfo = {
      endpoint: 'localhost:8080',
      name: 'Kafka - Notification',
      extras: {brokers: ['localhost:8083']}
    };

    it('should successfully retrieve status and info about Kafka that it is not running', async () => {
      const status = new StatusService(config, {}, {}, {}, new NotificationService(config.kafka));
      const notification = await status.getNotificationSystemAsComponent();

      expectedInfo.status = {ok: false, configured: true, isCritical: false, message: 'KafkaJSNumberOfRetriesExceeded'};
      assert.deepStrictEqual(notification, expectedInfo);
    }).timeout(5000);

    it('should successfully return that Kafka was not configured if configuration is not provided', async () => {
      const status = new StatusService({}, {}, {}, {}, new NotificationService());
      const notification = await status.getNotificationSystemAsComponent();

      const expected = {
        name: 'Kafka - Notification',
        status: {ok: false, configured: false, isCritical: false, message: 'This service was not configured'}
      };
      assert.deepStrictEqual(notification, expected);
    });
  });

  describe('Test AliECS Integrated Services Status', async () => {
    let ctrlService;
    const config = {grpc: {hostname: 'local', port: 8081}};
    beforeEach(() => ctrlService = {});

    it('should successfully retrieve status and info about AliECS services', async () => {
      const services = {
        services: {
          dcs: {connectionState: 'READY', enabled: true},
          otherDcs: {connectionState: 'TRANSIENT_FAILURE', enabled: true}
        }
      }
      ctrlService.getIntegratedServicesInfo = sinon.stub().resolves(services);
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.retrieveAliECSIntegratedInfo();

      const expServices = {
        dcs: {
          extras: {},
          connectionState: 'READY',
          name: 'dcs',
          status: {ok: true, configured: true, isCritical: true}
        },
        otherDcs: {
          connectionState: 'TRANSIENT_FAILURE',
          extras: {},
          name: 'otherDcs',
          status: {ok: false, configured: true, isCritical: true}
        }
      }
      assert.deepStrictEqual(coreStatus, expServices);
    });

    it('should successfully retrieve status and info about AliECS that it is not running for integration', async () => {
      ctrlService.getIntegratedServicesInfo = sinon.stub().rejects('Unable to query Core');
      const status = new StatusService(config, ctrlService, {});
      const coreStatus = await status.retrieveAliECSIntegratedInfo();

      const expectedInfo = {
        ALL: {status: {ok: false, configured: true, isCritical: true, message: 'Unable to query Core'}}
      };
      assert.deepStrictEqual(coreStatus, expectedInfo);
    });
  });

  describe('Test Apricot status', () => {
    let apricotService;
    const config = {apricot: {hostname: 'local', port: 8081, timeout: 20, maxMessageLength: 50}};
    const expectedInfo = {
      name: 'Apricot',
      endpoint: `${config.apricot.hostname}:${config.apricot.port}`,
      extras: {
        timeout: config.apricot.timeout,
        maxMessageLength: config.apricot.maxMessageLength,
      },
    };
    beforeEach(() => apricotService = {});

    it('should successfully retrieve status and info about Apricot that it is running', async () => {
      apricotService.getStatus = sinon.stub().resolves();
      const statusService = new StatusService(config, {}, {}, apricotService);

      const apricot = await statusService.getApricotAsComponent();

      expectedInfo.status = {ok: true, configured: true, isCritical: true};
      assert.deepStrictEqual(apricot, expectedInfo);
    });

    it('should successfully retrieve status and info about Apricot that it is NOT running', async () => {
      apricotService.getStatus = sinon.stub().rejects('Unable to check status of Apricot');
      const statusService = new StatusService(config, {}, {}, apricotService);

      const apricot = await statusService.getApricotAsComponent();

      expectedInfo.status = {
        ok: false, configured: true, isCritical: true, message: 'Unable to check status of Apricot'
      };
      assert.deepStrictEqual(apricot, expectedInfo);
    });

    it('should successfully return that Apricot was not configured if configuration is not provided', async () => {
      const statusService = new StatusService({}, apricotService, {});
      const status = await statusService.getApricotAsComponent();

      const expected = {
        name: 'Apricot',
        status: {ok: false, configured: false, isCritical: true, message: 'This service was not configured'}
      };
      assert.deepStrictEqual(status, expected);
    });
  });

  describe('System Components status test suite', async () => {
    it('should successfully return both FLP and PDP versions', async () => {
      const getRuntimeEntryByComponent = sinon.stub();
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.FLP_VERSION_KEY).resolves('0.101.0-1');
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.PDP_VERSION_COMPONENT, RUNTIME_COMPONENTS.PDP_VERSION_KEY).resolves('DDv1.5.6-experimental-flp-suite-v0.101.0-1')

      const statusService = new StatusService();
      statusService._apricotService = {getRuntimeEntryByComponent};

      const {status, extras} = await statusService.retrieveSystemCompatibility();
      assert.deepStrictEqual(status, {ok: true, configured: true, isCritical: true});
      assert.deepStrictEqual(extras, {flpVersion: '0.101.0-1', pdpVersion: 'DDv1.5.6-experimental-flp-suite-v0.101.0-1'});
    });

    it('should successfully return only PDP version even when FLP fails', async () => {
      const getRuntimeEntryByComponent = sinon.stub();
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.FLP_VERSION_KEY).rejects(new Error('nil'));
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.PDP_VERSION_COMPONENT, RUNTIME_COMPONENTS.PDP_VERSION_KEY).resolves('DDv1.5.6-experimental-flp-suite-v0.101.0-1');

      const statusService = new StatusService();
      statusService._apricotService = {getRuntimeEntryByComponent};

      const {status, extras} = await statusService.retrieveSystemCompatibility();
      assert.deepStrictEqual(status, {ok: true, configured: true, isCritical: true});
      assert.deepStrictEqual(extras, {flpVersion: '', pdpVersion: 'DDv1.5.6-experimental-flp-suite-v0.101.0-1'});
    });

    it('should successfully return only FLP version even when PDP fails', async () => {
      const getRuntimeEntryByComponent = sinon.stub();
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.FLP_VERSION_KEY).resolves('0.101.0-1');
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.PDP_VERSION_COMPONENT, RUNTIME_COMPONENTS.PDP_VERSION_KEY).rejects(new Error('nil'));

      const statusService = new StatusService();
      statusService._apricotService = {getRuntimeEntryByComponent};

      const {status, extras} = await statusService.retrieveSystemCompatibility();
      assert.deepStrictEqual(status, {ok: true, configured: true, isCritical: true});
      assert.deepStrictEqual(extras, {flpVersion: '0.101.0-1', pdpVersion: ''});
    });

    it('should return error status when the 2 versions do not match', async () => {
      const getRuntimeEntryByComponent = sinon.stub();
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.FLP_VERSION_KEY).resolves('0.102.0-1');
      getRuntimeEntryByComponent.withArgs(RUNTIME_COMPONENTS.PDP_VERSION_COMPONENT, RUNTIME_COMPONENTS.PDP_VERSION_KEY).resolves('DDv1.5.6-experimental-flp-suite-v0.101.0-1');

      const statusService = new StatusService();
      statusService._apricotService = {getRuntimeEntryByComponent};

      const {status, extras} = await statusService.retrieveSystemCompatibility();
      assert.deepStrictEqual(status, {ok: false, configured: true, isCritical: true});
      assert.deepStrictEqual(extras, {flpVersion: '0.102.0-1', pdpVersion: 'DDv1.5.6-experimental-flp-suite-v0.101.0-1'});
    });
  });

  after(nock.cleanAll)
});
