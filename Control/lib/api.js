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

const {WebSocketMessage, ConsulService} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'cog'}/api`);
const config = require('./config/configProvider.js');

// services
const Padlock = require('./services/Padlock.js');
const StatusService = require('./services/StatusService.js');

// connectors
const KafkaConnector = require('./connectors/KafkaConnector.js');
const ConsulConnector = require('./connectors/ConsulConnector.js');

// AliECS Core
const ControlProxy = require('./control-core/ControlProxy.js');
const ControlService = require('./control-core/ControlService.js');

if (!config.grpc) {
  throw new Error('GRPC Configuration is missing');
}
if (!config.grafana) {
  log.error('Grafana Configuration is missing');
}
const padLock = new Padlock();

let consulService;
if (config.consul) {
  consulService = new ConsulService(config.consul);
}
const consulConnector = new ConsulConnector(consulService, config.consul, padLock);
consulConnector.testConsulStatus();

const ctrlProxy = new ControlProxy(config.grpc);
const ctrlService = new ControlService(padLock, ctrlProxy, consulConnector, config.grpc);
const statusService = new StatusService(config, ctrlService, consulService);

module.exports.setup = (http, ws) => {
  ctrlService.setWS(ws);
  const coreMiddleware = [
    (req, res, next) => ctrlService.isConnectionReady(req, res, next),
    (req, res, next) => ctrlService.isLockSetUp(req, res, next),
    (req, res, next) => ctrlService.logAction(req, res, next),
  ]

  // AliECS Core
  ctrlProxy.methods.forEach((method) =>
    http.post(`/${method}`, coreMiddleware, (req, res) => ctrlService.executeCommand(req, res))
  );
  http.post('/clean/resources', coreMiddleware, (req, res) => ctrlService.cleanResources(req, res));
  http.post('/execute/o2-roc-config', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));

  // Lock Service
  http.post('/lockState', (_, res) => res.json(padLock));
  http.post('/lock', lock);
  http.post('/unlock', unlock);
  http.post('/forceUnlock', forceUnlock);

  // Status Service // TODO what if error?
  http.get('/status/consul', (_, res) => statusService.getConsulStatus().then((data) => res.status(200).json(data)));
  http.get('/status/grafana', (_, res) => statusService.getGrafanaStatus().then((data) => res.status(200).json(data)));
  http.get('/status/kafka', (_, res) => statusService.getKafkaStatus().then((data) => res.status(200).json(data)));
  http.get('/status/gui', (_, res) => res.status(200).json(statusService.getGuiStatus()), {public: true});
  http.get('/status/core',
    (req, res, next) => ctrlService.isConnectionReady(req, res, next),
    (_, res) => statusService.getAliEcsCoreStatus().then((data) => res.status(200).json(data))
  );
  http.get('/status/core/services',
    (req, res, next) => ctrlService.isConnectionReady(req, res, next),
    (_, res) => statusService.getIntegratedServicesInfo().then((data) => res.status(200).json(data))
  );

  // Consul
  const validateService = consulConnector.validateService.bind(consulConnector);
  http.get('/consul/flps', validateService, (req, res) => consulConnector.getFLPs(req, res));
  http.get('/consul/crus', validateService, (req, res) => consulConnector.getCRUs(req, res));
  http.get('/consul/crus/config', validateService, (req, res) => consulConnector.getCRUsWithConfiguration(req, res));
  http.post('/consul/crus/config/save', validateService, (req, res) => consulConnector.saveCRUsConfiguration(req, res));

  const kafka = new KafkaConnector(config.kafka, ws);
  if (kafka.isKafkaConfigured()) {
    kafka.initializeKafkaConsumerGroup();
  }

  /**
   * Send to all users state of Pad via Websocket
   */
  const broadcastPadState = () => {
    ws.broadcast(new WebSocketMessage().setCommand('padlock-update').setPayload(padLock));
  };

  /**
   * Method to try to acquire lock
   * @param {Request} req
   * @param {Response} res
   */
  function lock(req, res) {
    try {
      padLock.lockBy(req.session.personid, req.session.name);
      log.info(`Lock taken by ${req.session.name}`);
      res.status(200).json({ok: true});
    } catch (error) {
      log.error(`Unable to lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
    }
    broadcastPadState();
  }

  /**
   * Method to try to release lock
   * @param {Request} req
   * @param {Response} res
  */
  function forceUnlock(req, res) {
    try {
      padLock.forceUnlock(req.session.access);
      log.info(`Lock forced by ${req.session.name}`);
      res.status(200).json({ok: true});
    } catch (error) {
      log.error(`Unable to force lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
    }
    broadcastPadState();
  }

  /**
   * Method to try to release lock
   * @param {Request} req
   * @param {Response} res
   */
  function unlock(req, res) {
    try {
      padLock.unlockBy(req.session.personid);
      log.info(`Lock released by ${req.session.name}`);
      res.status(200).json({ok: true});
    } catch (error) {
      log.error(`Unable to give away lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
    }
    broadcastPadState();
  }
};
