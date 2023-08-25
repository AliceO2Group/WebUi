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

const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'cog'}/api`);
const config = require('./config/configProvider.js');

// controllers
const {StatusController} = require('./controllers/Status.controller.js');
const {WebSocketService} = require('./services/WebSocket.service.js');
const {ConsulController} = require('./controllers/Consul.controller.js');

// local services
const Lock = require('./services/Lock.js');
const {StatusService} = require('./services/Status.service.js');
const {Intervals} = require('./services/Intervals.service.js');

// web-ui services
const {NotificationService, ConsulService} = require('@aliceo2/web-ui');

// AliECS Core
const GrpcProxy = require('./control-core/GrpcProxy.js');
const ControlService = require('./control-core/ControlService.js');
const ApricotService = require('./control-core/ApricotService.js');
const AliecsRequestHandler = require('./control-core/RequestHandler.js');
const EnvCache = require('./control-core/EnvCache.js');
const {EnvironmentService} = require('./services/Environment.service.js');
const {WorkflowTemplateService} = require('./services/WorkflowTemplate.service.js');

const {EnvironmentController} = require('./controllers/Environment.controller.js');

const path = require('path');
const {WorkflowTemplateController} = require('./controllers/WorkflowTemplate.controller.js');
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

module.exports.setup = (http, ws) => {
  const lock = new Lock();
  lock.setWs(ws);

  let consulService;
  if (config.consul) {
    consulService = new ConsulService(config.consul);
  }
  const wsService = new WebSocketService(ws);

  const consulController = new ConsulController(consulService, config.consul);
  consulController.testConsulStatus();

  const ctrlProxy = new GrpcProxy(config.grpc, O2_CONTROL_PROTO_PATH);
  const ctrlService = new ControlService(ctrlProxy, consulController, config.grpc, O2_CONTROL_PROTO_PATH);
  ctrlService.setWS(ws);
  const apricotProxy = new GrpcProxy(config.apricot, O2_APRICOT_PROTO_PATH);
  const apricotService = new ApricotService(apricotProxy);

  const envService = new EnvironmentService(ctrlProxy, apricotService);
  const workflowService = new WorkflowTemplateService(ctrlProxy, apricotService);

  const envCtrl = new EnvironmentController(envService);
  const workflowController = new WorkflowTemplateController(workflowService);

  const aliecsReqHandler = new AliecsRequestHandler(ctrlService);
  aliecsReqHandler.setWs(ws);

  const envCache = new EnvCache(ctrlService);
  envCache.setWs(ws);

  const notificationService = new NotificationService(config.kafka);
  if (notificationService.isConfigured()) {
    notificationService.proxyWebNotificationToWs(ws);
  }

  const statusService = new StatusService(
    config, ctrlService, consulService, apricotService, notificationService, wsService
  );
  const statusController = new StatusController(statusService);

  const intervals = new Intervals(statusService);
  intervals.initializeIntervals();

  const coreMiddleware = [
    ctrlService.isConnectionReady.bind(ctrlService),
    ctrlService.logAction.bind(ctrlService),
  ];

  ctrlProxy.methods.forEach(
    (method) => http.post(`/${method}`, coreMiddleware, (req, res) => ctrlService.executeCommand(req, res))
  );
  http.post('/core/request', coreMiddleware, (req, res) => aliecsReqHandler.add(req, res));
  http.get('/core/requests', coreMiddleware, (req, res) => aliecsReqHandler.getAll(req, res));
  http.post('/core/removeRequest/:id', coreMiddleware, (req, res) => aliecsReqHandler.remove(req, res));

  http.get('/workflow/template/default/source', workflowController.getDefaultTemplateSource.bind(workflowController));
  http.get('/workflow/template/mappings', workflowController.getWorkflowMapping.bind(workflowController))

  http.get('/environment/:id/:source?', coreMiddleware, envCtrl.getEnvironment.bind(envCtrl), {public: true});
  http.get('/core/environments', coreMiddleware, (req, res) => envCache.get(req, res));
  http.post('/core/environments/configuration/save', (req, res) => apricotService.saveCoreEnvConfig(req, res));
  http.post('/core/environments/configuration/update', (req, res) => apricotService.updateCoreEnvConfig(req, res));

  apricotProxy.methods.forEach(
    (method) => http.post(`/${method}`, (req, res) => apricotService.executeCommand(req, res))
  );
  http.get('/core/detectors', (req, res) => apricotService.getDetectorList(req, res));
  http.get('/core/hostsByDetectors', (req, res) => apricotService.getHostsByDetectorList(req, res));

  http.post('/execute/resources-cleanup', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));
  http.post('/execute/o2-roc-config', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));

  // Lock Service
  http.post('/lockState', (req, res) => res.json(lock.state(req.body.name)));
  http.post('/lock', (req, res) => lock.lockDetector(req, res));
  http.post('/unlock', (req, res) => lock.unlockDetector(req, res));
  http.post('/forceUnlock', (req, res) => lock.forceUnlock(req, res));

  // Status Service
  http.get('/status/consul', statusController.getConsulStatus.bind(statusController));
  http.get('/status/grafana', statusController.getGrafanaStatus.bind(statusController));
  http.get('/status/notification', statusController.getNotificationSystemStatus.bind(statusController));
  http.get('/status/gui', statusController.getGuiStatus.bind(statusController), {public: true});
  http.get('/status/apricot', statusController.getApricotStatus.bind(statusController));
  http.get('/status/core', coreMiddleware[0], statusController.getAliECSStatus.bind(statusController));
  http.get('/status/core/services', coreMiddleware[0],
    statusController.getAliECSIntegratedServicesStatus.bind(statusController)
  );

  // Consul
  const validateService = consulController.validateService.bind(consulController);
  http.get('/consul/flps', validateService, consulController.getFLPs.bind(consulController));
  http.get('/consul/crus', validateService, consulController.getCRUs.bind(consulController));
  http.get('/consul/crus/config', validateService, consulController.getCRUsWithConfiguration.bind(consulController));
  http.get('/consul/crus/aliases', validateService, consulController.getCRUsAlias.bind(consulController));
  http.post('/consul/crus/config/save', validateService, consulController.saveCRUsConfiguration.bind(consulController));
};
