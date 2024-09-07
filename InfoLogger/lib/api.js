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

const { LogManager, WebSocketMessage, InfoLoggerReceiver, MySQL } = require('@aliceo2/web-ui');
const { QueryService } = require('./services/QueryService.js');
const ProfileService = require('./ProfileService.js');
const JsonFileConnector = require('./JSONFileConnector.js');
const StatusService = require('./StatusService.js');

const { serviceAvailabilityCheck } = require('./middleware/serviceAvailabilityCheck.middleware.js');

const projPackage = require('./../package.json');
const config = require('./configProvider.js');

let liveSource = null;
let sqlService = null;
let queryService = null;

module.exports.attachTo = async (http, ws) => {
  const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/api`);

  const { QueryController } = await import('./controller/QueryController.mjs');

  if (config.mysql) {
    sqlService = new MySQL(config.mysql);
    queryService = new QueryService(sqlService, config.mysql);
  }
  const queryController = new QueryController(queryService);

  const statusService = new StatusService(config, projPackage, ws);
  statusService.setQuerySource(queryService);

  const jsonDb = new JsonFileConnector(config.dbFile || `${__dirname}/../db.json`);
  const profileService = new ProfileService(jsonDb);

  http.post(
    '/query',
    serviceAvailabilityCheck(queryService),
    queryController.getLogs.bind(queryController),
  );
  http.get(
    '/query/stats',
    serviceAvailabilityCheck(queryService),
    queryController.getQueryStats.bind(queryController),
    { public: true },
  );

  http.get('/status/gui', statusService.getILGStatus.bind(statusService), { public: true });
  http.get('/getFrameworkInfo', statusService.frameworkInfo.bind(statusService));

  http.get('/getUserProfile', (req, res) => profileService.getUserProfile(req, res));
  http.get('/getProfile', (req, res) => profileService.getProfile(req, res));
  http.post('/saveUserProfile', (req, res) => profileService.saveUserProfile(req, res));

  if (config.infoLoggerServer) {
    logger.info('[API] InfoLogger server config found');
    liveSource = new InfoLoggerReceiver();
    liveSource.connect(config.infoLoggerServer);
    statusService.setLiveSource(liveSource);
  } else {
    logger.warn('[API] InfoLogger server config not found, Live mode not available');
  }

  if (liveSource) {
    liveSource.on('message', (message) => {
      const msg = new WebSocketMessage();
      msg.command = 'live-log';
      msg.payload = message;
      ws.broadcast(msg);
    });

    liveSource.on('connected', () => {
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-server-connected'));
    });

    liveSource.on('connection-issue', () => {
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-server-connection-issue'));
    });

    liveSource.on('close', () => {
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-server-close'));
    });
  }
};
