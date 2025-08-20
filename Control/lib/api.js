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

const { EventEmitter } = require('events');
const { Kafka, logLevel } = require('kafkajs');
const logger = (require('@aliceo2/web-ui').LogManager)
  .getLogger(`${process.env.npm_config_log_label ?? 'cog'}/api`);
const config = require('./config/configProvider.js');

const { DetectorId } = require('./common/detectorId.enum.js');

// middleware
const {addDetectorIdMiddleware} = require('./middleware/addDetectorId.middleware.js');
const {logDeploymentRequestMiddleware} = require('./middleware/logDeploymentRequest.middleware.js');
const {minimumRoleMiddleware} = require('./middleware/minimumRole.middleware.js');
const {requireDetectorOrGlobalRoleMiddleware} = require('./middleware/requireDetectorOrGlobalRole.middleware.js');
const {
  setDetectorsFromEnvironmentMiddlewareFactory
} = require('./middleware/setDetectorsFromEnvironmentMiddlewareFactory.js');
const {
  getDetectorsLockOwnershipMiddlewareFactory
} = require('./middleware/getDetectorsLockOwnershipMiddlewareFactory.js');

// controllers
const {ConsulController} = require('./controllers/Consul.controller.js');
const {DeploymentController} = require('./controllers/Deployment.controller.js');
const {EnvironmentController} = require('./controllers/Environment.controller.js');
const {LockController} = require('./controllers/Lock.controller.js');
const {RunController} = require('./controllers/Run.controller.js');
const {StatusController} = require('./controllers/Status.controller.js');
const {TaskController} = require('./controllers/Task.controller.js');
const {WebSocketService} = require('./services/WebSocket.service.js');
const {WorkflowTemplateController} = require('./controllers/WorkflowTemplate.controller.js');

// local services
const {BookkeepingService} = require('./services/Bookkeeping.service.js');
const {BroadcastService} = require('./services/Broadcast.service.js');
const {CacheService} = require('./services/Cache.service.js');
const {DeploymentService} = require('./services/Deployment.service.js');
const {DetectorService} = require('./services/Detector.service.js');
const {EnvironmentCacheService} = require('./services/environment/EnvironmentCache.service.js');
const {EnvironmentService} = require('./services/Environment.service.js');
const {Intervals} = require('./services/Intervals.service.js');
const {LockService} = require('./services/Lock.service.js');
const {RunService} = require('./services/Run.service.js');
const {StatusService} = require('./services/Status.service.js');
const {TaskService} = require('./services/Task.service.js');
const {WorkflowTemplateService} = require('./services/WorkflowTemplate.service.js');

// web-ui services
const {NotificationService, ConsulService} = require('@aliceo2/web-ui');

// AliECS Core
const { AliEcsSynchronizer } = require('./kafka/AliEcsSynchronizer.js');
const ApricotService = require('./control-core/ApricotService.js');
const ControlService = require('./control-core/ControlService.js');
const GrpcServiceClient = require('./control-core/GrpcServiceClient.js');

const path = require('path');
const O2_CONTROL_PROTO_PATH = path.join(__dirname, './../protobuf/o2control.proto');
const O2_APRICOT_PROTO_PATH = path.join(__dirname, './../protobuf/o2apricot.proto');

const {Role} = require('./common/role.enum.js');

if (!config.grpc) {
  throw new Error('Control gRPC Configuration is missing');
}
if (!config.apricot) {
  throw new Error('Apricot gRPC Configuration is missing');
}
if (!config.grafana) {
  logger.error('Grafana Configuration is missing');
}

module.exports.setup = (http, ws) => {
  const eventEmitter = new EventEmitter();
  
  /**
   * Services are initialized with the configuration they need and in order of their dependencies.
   * The services are then used by the controllers to perform actions.
   */
  let consulService;
  if (config.consul) {
    consulService = new ConsulService(config.consul);
  }
  const wsService = new WebSocketService(ws);
  const broadcastService = new BroadcastService(ws);
  const cacheService = new CacheService(broadcastService);
  const environmentCacheService = new EnvironmentCacheService(broadcastService, eventEmitter);

  const consulController = new ConsulController(consulService, config.consul);
  consulController.testConsulStatus();

  const ctrlProxy = new GrpcServiceClient(config.grpc, O2_CONTROL_PROTO_PATH);
  const ctrlService = new ControlService(ctrlProxy, consulController, config.grpc, O2_CONTROL_PROTO_PATH);
  ctrlService.setWS(ws);
  const apricotProxy = new GrpcServiceClient(config.apricot, O2_APRICOT_PROTO_PATH);
  const apricotService = new ApricotService(apricotProxy);

  const lockService = new LockService(broadcastService);
  const lockController = new LockController(lockService);

  const detectorService = new DetectorService(ctrlProxy);
  const environmentService = new EnvironmentService(
    ctrlProxy, apricotService, cacheService, broadcastService, environmentCacheService
  );
  const workflowService = new WorkflowTemplateService(ctrlProxy, apricotService);
  const deploymentService = new DeploymentService(environmentService, workflowService, environmentCacheService);
  const taskService = new TaskService(ctrlProxy)

  /**
   * Controllers are initialized with the services they depend on.
   */
  const envCtrl = new EnvironmentController(environmentService, workflowService, lockService, detectorService);
  const workflowController = new WorkflowTemplateController(workflowService);
  const deploymentController = new DeploymentController(deploymentService);
  const taskController = new TaskController(taskService);

  const bkpService = new BookkeepingService(config.bookkeeping ?? {});
  const runService = new RunService(bkpService, apricotService, cacheService);
  runService.retrieveStaticConfigurations();
  const runController = new RunController(runService, cacheService);

  const notificationService = new NotificationService();
  if (notificationService.isConfigured()) {
    notificationService.proxyWebNotificationToWs(ws);
  }

  let aliEcsSynchronizer = undefined;
  if (config.kafka && config.kafka?.enable) {
    try {
      const kafkaClient = new Kafka({
        clientId: 'control-gui',
        brokers: config.kafka.brokers,
        retry: { retries: Infinity },
        logLevel: logLevel.NOTHING,
      });
      aliEcsSynchronizer = new AliEcsSynchronizer(kafkaClient, cacheService, eventEmitter);
      aliEcsSynchronizer.start();
    
    } catch (error) {
      logger.errorMessage(`Kafka initialization failed: ${error.message}`);
    }
  }

  const statusService = new StatusService(
    config, ctrlService, consulService, apricotService, notificationService, wsService,
  );
  const statusController = new StatusController(statusService);

  const intervals = new Intervals();

  initializeData(apricotService, lockService);
  initializeIntervals(intervals, statusService, runService, bkpService, environmentService);

  const coreMiddleware = [
    ctrlService.isConnectionReady.bind(ctrlService),
  ];
  const setDetectorsFromEnvironmentMiddleware = setDetectorsFromEnvironmentMiddlewareFactory(environmentService);
  const verifyLockOwnershipMiddleware = getDetectorsLockOwnershipMiddlewareFactory(lockService);

  ctrlProxy.methods.forEach(
    (method) => http.post(`/${method}`, coreMiddleware, (req, res) => ctrlService.executeCommand(req, res)),
  );

  http.get('/workflow/template/default/source', workflowController.getDefaultTemplateSource.bind(workflowController));
  http.get('/workflow/template/mappings', workflowController.getWorkflowMapping.bind(workflowController));
  http.get('/workflow/configuration', workflowController.getWorkflowConfiguration.bind(workflowController));

  http.get('/runs/calibration/config', [
    minimumRoleMiddleware(Role.GLOBAL),
  ], runController.refreshCalibrationRunsConfigurationHandler.bind(runController));

  http.get('/runs/calibration', runController.getCalibrationRunsHandler.bind(runController));

  http.get('/environments', coreMiddleware, envCtrl.getEnvironmentsHandler.bind(envCtrl), {public: true});
  http.get('/environment/:id/:source?', coreMiddleware, envCtrl.getEnvironmentHandler.bind(envCtrl), {public: true});
  http.post('/environment/auto', coreMiddleware, envCtrl.newAutoEnvironmentHandler.bind(envCtrl));
  http.put('/environment/:id', coreMiddleware, envCtrl.transitionEnvironmentHandler.bind(envCtrl));
  http.delete('/environment/:id',
    coreMiddleware,
    minimumRoleMiddleware(Role.DETECTOR),
    setDetectorsFromEnvironmentMiddleware,
    verifyLockOwnershipMiddleware,
    envCtrl.destroyEnvironmentHandler.bind(envCtrl),
  );

  http.post('/deploy',
    coreMiddleware,
    logDeploymentRequestMiddleware,
    minimumRoleMiddleware(Role.DETECTOR),
    verifyLockOwnershipMiddleware,
    deploymentController.newAsyncDeploymentHandler.bind(deploymentController)
  );

  http.delete('/deploy/:id',
    minimumRoleMiddleware(Role.DETECTOR),
    deploymentController.acknowledgeDeploymentFailureHandler.bind(deploymentController)
  );

  http.post('/core/environments/configuration/save', (req, res) => apricotService.saveCoreEnvConfig(req, res));
  http.post('/core/environments/configuration/update', (req, res) => apricotService.updateCoreEnvConfig(req, res));

  /**
   * Tasks Routes
   */
  http.get('/tasks/:id', coreMiddleware, taskController.getTaskHandler.bind(taskController));
  http.get('/tasks', coreMiddleware, taskController.getTaskListHandler.bind(taskController));
  http.delete('/tasks', coreMiddleware, taskController.cleanUpTasksHandler.bind(taskController));

  apricotProxy.methods.forEach(
    (method) => http.post(`/${method}`, (req, res) => apricotService.executeCommand(req, res)),
  );
  http.get('/core/detectors', (req, res) => apricotService.getDetectorList(req, res));
  http.get('/core/hostsByDetectors', (req, res) => apricotService.getHostsByDetectorList(req, res));

  http.post('/execute/resources-cleanup', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));
  http.post('/execute/o2-roc-config', coreMiddleware, (req, res) => ctrlService.createAutoEnvironment(req, res));

  // Lock Service
  http.get('/locks', lockController.getLocksStateHandler.bind(lockController));

  http.put(`/locks/:action/${DetectorId.ALL}`,
    minimumRoleMiddleware(Role.GLOBAL),
    addDetectorIdMiddleware(DetectorId.ALL),
    lockController.actionLockHandler.bind(lockController)
  );

  http.put('/locks/:action/:detectorId',
    minimumRoleMiddleware(Role.DETECTOR),
    requireDetectorOrGlobalRoleMiddleware,
    lockController.actionLockHandler.bind(lockController)
  );
  http.put('/locks/force/:action/:detectorId',
    minimumRoleMiddleware(Role.GLOBAL),
    lockController.actionForceLockHandler.bind(lockController));

  // Status Service
  http.get('/status/consul', statusController.getConsulStatus.bind(statusController));
  http.get('/status/grafana', statusController.getGrafanaStatus.bind(statusController));
  http.get('/status/notification', statusController.getNotificationSystemStatus.bind(statusController));
  http.get('/status/gui', statusController.getGuiStatus.bind(statusController), {public: true});
  http.get('/status/apricot', statusController.getApricotStatus.bind(statusController));
  http.get('/status/core', coreMiddleware[0], statusController.getAliECSStatus.bind(statusController));
  http.get('/status/system', statusController.getSystemCompatibility.bind(statusController));
  http.get('/status/core/services', coreMiddleware[0],
    statusController.getAliECSIntegratedServicesStatus.bind(statusController),
  );

  // Consul
  const validateService = consulController.validateService.bind(consulController);
  http.get('/consul/flps', validateService, consulController.getFLPs.bind(consulController));
  http.get('/consul/crus', validateService, consulController.getCRUs.bind(consulController));
  http.get('/consul/crus/config', validateService, consulController.getCRUsWithConfiguration.bind(consulController));
  http.get('/consul/crus/aliases', validateService, consulController.getCRUsAlias.bind(consulController));
  http.post('/consul/crus/config/save', validateService, consulController.saveCRUsConfiguration.bind(consulController));
};

/**
 * Method to register services at the start of the server
 * @param {Intervals} intervalsService - wrapper for storing intervals
 * @param {StatusService} statusService - service used for retrieving status on dependent services
 * @param {RunService} runService - service for retrieving and building information on runs
 * @param {BookkeepingService} bkpService - service for retrieving information on runs from Bookkeeping
 * @param {EnvironmentService} environmentService - service for retrieving information on environments
 * @return {void}
 */
function initializeIntervals(intervalsService, statusService, runService, bkpService, environmentService) {
  const SERVICES_REFRESH_RATE = 10000;
  const ENVIRONMENT_REFRESH_RATE = 5000;
  const CALIBRATION_RUNS_REFRESH_RATE = bkpService.refreshRate;

  intervalsService.register(statusService.retrieveConsulStatus.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(statusService.retrieveAliEcsCoreInfo.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(statusService.retrieveApricotStatus.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(statusService.retrieveGrafanaStatus.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(statusService.retrieveSystemCompatibility.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(statusService.retrieveNotificationSystemStatus.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(statusService.retrieveAliECSIntegratedInfo.bind(statusService), SERVICES_REFRESH_RATE);
  intervalsService.register(async () => {
    try {
      await environmentService.getEnvironments(false, true)
    } catch (error) {
      logger.errorMessage(`Error retrieving environments: ${error.message}`);   
    }
  }, ENVIRONMENT_REFRESH_RATE);

  if (config.bookkeeping) {
    intervalsService.register(
      runService.retrieveCalibrationRunsGroupedByDetector.bind(runService),
      CALIBRATION_RUNS_REFRESH_RATE,
    );
  }
}

/**
 * Function to initialize in order dependent services
 * @param {ApricotService} apricotService - request initial set of data from AliECS/Apricot
 * @param {LockService} lockService - initialize service with data from Apricot
 */
async function initializeData(apricotService, lockService) {
  await apricotService.init();
  lockService.setLockStatesForDetectors(apricotService.detectors);
}
