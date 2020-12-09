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

const {Log, WebSocketMessage, InfoLoggerReceiver} = require('@aliceo2/web-ui');
const log = new Log('InfoLogger');
const config = require('./configProvider.js');
const SQLDataSource = require('./SQLDataSource.js');
const ProfileService = require('./ProfileService.js');
const {MySQL} = require('@aliceo2/web-ui');
const JsonFileConnector = require('./JSONFileConnector.js');
const projPackage = require('../package.json');
const StatusService = require('./StatusService.js');

let querySource = null;
let liveSource = null;

const jsonDb = new JsonFileConnector(config.dbFile || __dirname + '/../db.json');
const profileService = new ProfileService(jsonDb);
const statusService = new StatusService(config, projPackage);

if (config.mysql) {
  log.info(`Detected InfoLogger database configration`);
  const connector = new MySQL(config.mysql);
  connector.testConnection().then(() => {
    querySource = new SQLDataSource(connector, config.mysql);
    querySource.isConnectionUpAndRunning().catch((error) => {
      log.error(`Unable to instantiate data source due to ${error}`);
      querySource = null;
    });
    statusService.setQuerySource(querySource);
  }).catch((error) => {
    log.error(`Unable to connect to mysql due to ${error}`);
    querySource = null;
  });
} else {
  log.warn(`InfoLogger database config not found, Query mode not available`);
}

if (config.infoLoggerServer) {
  log.info(`InfoLogger server config found`);
  liveSource = new InfoLoggerReceiver();
  liveSource.connect(config.infoLoggerServer);
  statusService.setLiveSource(liveSource);
} else {
  log.warn(`InfoLogger server config not found, Live mode not available`);
}

module.exports.attachTo = (http, ws) => {
  http.get('/getFrameworkInfo', statusService.frameworkInfo.bind(statusService));
  http.get('/getUserProfile', (req, res) => profileService.getUserProfile(req, res));
  http.get('/getProfile', (req, res) => profileService.getProfile(req, res));
  http.post('/services', getServicesStatus);
  http.post('/query', query);
  http.post('/saveUserProfile', (req, res) => profileService.saveUserProfile(req, res));

  /**
   * Method to send back the status of the current services (e.g query/live)
   * @param {Request} req
   * @param {Response} res
   */
  function getServicesStatus(req, res) {
    res.json({
      query: !!querySource,
      live: !!liveSource.isConnected,
      streamHostname: config.infoLoggerServer && config.infoLoggerServer.host
    });
  }

  /**
   * Method to perform a query on the SQL Data Source
   * @param {Request} req
   * @param {Response} res
   */
  function query(req, res) {
    if (querySource) {
      querySource.queryFromFilters(req.body.criterias, req.body.options)
        .then((result) => res.json(result))
        .catch((error) => handleError(res, error));
    } else {
      handleError(res, 'MySQL Data Source is not available');
    }
  }

  /**
   * Catch all HTTP errors
   * @param {Object} res
   * @param {Error} error
   * @param {number} status
   */
  function handleError(res, error, status=500) {
    log.trace(error);
    res.status(status).json({message: error.message});
  }

  if (liveSource) {
    liveSource.on('message', (message) => {
      const msg = new WebSocketMessage();
      msg.command = 'live-log';
      msg.payload = message;
      ws.broadcast(msg);
    });

    liveSource.on('connection-issue', () => {
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-server-connection-issue'));
    });

    liveSource.on('close', () => {
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-server-close'));
    });
  }
};
