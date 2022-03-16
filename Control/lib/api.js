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

const {ConsulService} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'cog'}/api`);
const config = require('./config/configProvider.js');

// services
const Lock = require('./services/Lock.js');
const StatusService = require('./services/StatusService.js');

// connectors
const NotificationService = require('@aliceo2/web-ui').NotificationService;
const ConsulConnector = require('./connectors/ConsulConnector.js');

// AliECS Core
const GrpcProxy = require('./control-core/GrpcProxy.js');
const ControlService = require('./control-core/ControlService.js');
const ApricotService = require('./control-core/ApricotService.js');
const AliecsRequestHandler = require('./control-core/RequestHandler.js');

const path = require('path');
const O2_CONTROL_PROTO_PATH = path.join(__dirname, './../protobuf/o2control.proto');
const O2_APRICOT_PROTO_PATH = path.join(__dirname, './../protobuf/o2apricot.proto');

if (!config.grpc) {
  throw new Error('Control gRPC Configuration is missing');
}
if (!config.apricot) {
  throw new Error('Apricot gRPC Configuration is missing');
}
if (!config.grafana) {
  log.error('Grafana Configuration is missing');
}
const lock = new Lock();

let consulService;
if (config.consul) {
  consulService = new ConsulService(config.consul);
}
const consulConnector = new ConsulConnector(consulService, config.consul);
consulConnector.testConsulStatus();

const ctrlProxy = new GrpcProxy(config.grpc, O2_CONTROL_PROTO_PATH);
const ctrlService = new ControlService(ctrlProxy, consulConnector, config.grpc);

const apricotProxy = new GrpcProxy(config.apricot, O2_APRICOT_PROTO_PATH);
const apricotService = new ApricotService(apricotProxy);

const aliecsReqHandler = new AliecsRequestHandler(ctrlService);

const statusService = new StatusService(config, ctrlService, consulService, apricotService);

module.exports.setup = (http, ws) => {
  ctrlService.setWS(ws);
  lock.setWs(ws);

  const coreMiddleware = [
    ctrlService.isConnectionReady.bind(ctrlService),
    ctrlService.logAction.bind(ctrlService),
  ];
  ctrlProxy.methods.forEach(
    (method) => http.post(`/${method}`, coreMiddleware, (req, res) => ctrlService.executeCommand(req, res))
  );
  http.post('/NewEnvironmentRequest', coreMiddleware, (req, res) => aliecsReqHandler.add(req, res));
  http.post('/GetEnvironmentRequests', coreMiddleware, (req, res) => aliecsReqHandler.getAll(req, res));

  apricotProxy.methods.forEach(
    (method) => http.post(`/${method}`, (req, res) => apricotService.executeCommand(req, res))
  );
  http.get('/core/detectors', (req, res) => apricotService.getDetectorList(req, res));
  http.get('/core/hostsByDetectors', (req, res) => apricotService.getHostsByDetectorList(req, res));

  const notification = new NotificationService(config.kafka);
  if (notification.isConfigured()) {
    notification.proxyWebNotificationToWs(ws);
  }

  http.post('/configuration/save', (req, res) => apricotService.saveConfiguration(req, res));

  http.post('/execute/resources-cleanup', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));
  http.post('/execute/o2-roc-config', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));

  // Lock Service
  http.post('/lockState', (req, res) => res.json(lock.state(req.body.name)));
  http.post('/lock', (req, res) => lock.lockDetector(req, res));
  http.post('/unlock', (req, res) => lock.unlockDetector(req, res));
  http.post('/forceUnlock', (req, res) => lock.forceUnlock(req, res));

  // Status Service
  http.get('/status/consul', (_, res) => statusService.getConsulStatus().then((data) => res.status(200).json(data)));
  http.get('/status/grafana', (_, res) => statusService.getGrafanaStatus().then((data) => res.status(200).json(data)));
  http.get('/status/notification',
    (_, res) => statusService.getNotificationStatus(notification).then((data) => res.status(200).json(data))
  );
  http.get('/status/gui', (_, res) => res.status(200).json(statusService.getGuiStatus()), {public: true});
  http.get('/status/apricot', (_, res) => statusService.getApricotStatus().then((data) => res.status(200).json(data)));
  http.get('/status/core',
    (req, res, next) => ctrlService.isConnectionReady(req, res, next),
    (_, res) => statusService.getAliEcsCoreStatus().then((data) => res.status(200).json(data))
  );
  http.get('/status/core/services',
    (req, res, next) => ctrlService.isConnectionReady(req, res, next),
    (_, res) => statusService.getIntegratedServicesInfo().then((data) => res.status(200).json(data)),
    { public: true }
  );

  // Consul
  const validateService = consulConnector.validateService.bind(consulConnector);
  http.get('/consul/flps', validateService, (req, res) => consulConnector.getFLPs(req, res));
  http.get('/consul/crus', validateService, (req, res) => consulConnector.getCRUs(req, res));
  http.get('/consul/crus/config', validateService, (req, res) => consulConnector.getCRUsWithConfiguration(req, res));
  http.get('/consul/crus/aliases', validateService, (req, res) => consulConnector.getCRUsAlias(req, res));
  http.post('/consul/crus/config/save', validateService, (req, res) => consulConnector.saveCRUsConfiguration(req, res));
};
