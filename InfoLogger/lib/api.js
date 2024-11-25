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

const { InfoLoggerReceiver } = require('@aliceo2/web-ui');

const { StatusController } = require('./controller/StatusController.js');
const { QueryController } = require('./controller/QueryController.js');
const { LiveService } = require('./services/LiveService.js');
const { QueryService } = require('./services/QueryService.js');

const ProfileService = require('./ProfileService.js');
const JsonFileConnector = require('./JSONFileConnector.js');

const { serviceAvailabilityCheck } = require('./middleware/serviceAvailabilityCheck.middleware.js');

const projPackage = require('./../package.json');
const config = require('./configProvider.js');

let liveService = null;
let queryService = null;

module.exports.attachTo = async (http, ws) => {
  if (config.infoLoggerServer) {
    const infoLoggerReceiver = new InfoLoggerReceiver();
    liveService = new LiveService(ws, config.infoLoggerServer, infoLoggerReceiver);
    liveService.initialize();
  }

  if (config.mysql) {
    queryService = new QueryService(config.mysql);
    queryService.checkConnection(1, false);
  }
  const queryController = new QueryController(queryService);

  const statusController = new StatusController(config, projPackage, ws);
  statusController.querySource = queryService;
  statusController.liveSource = liveService;

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

  http.get('/status/gui', statusController.getILGStatus.bind(statusController), { public: true });
  http.get('/getFrameworkInfo', statusController.frameworkInfo.bind(statusController));

  http.get('/getUserProfile', (req, res) => profileService.getUserProfile(req, res));
  http.get('/getProfile', (req, res) => profileService.getProfile(req, res));
  http.post('/saveUserProfile', (req, res) => profileService.saveUserProfile(req, res));
};
