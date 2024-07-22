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
const SQLDataSource = require('./SQLDataSource.js');
const ProfileService = require('./ProfileService.js');
const JsonFileConnector = require('./JSONFileConnector.js');
const StatusService = require('./StatusService.js');

const projPackage = require('../package.json');

const logger = new LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/api`);
const config = require('./configProvider.js');

let querySource = null;
let liveSource = null;

const jsonDb = new JsonFileConnector(config.dbFile || `${__dirname}/../db.json`);

const profileService = new ProfileService(jsonDb);

module.exports.attachTo = async (http, ws) => {
  const { QueryController } = await import('./controller/QueryController.mjs');
  const queryController = new QueryController();

  const statusService = new StatusService(config, projPackage, ws);

  http.post('/query', query);
  http.get('/query/stats', queryController.getQueryStats.bind(queryController), { public: true });

  http.get('/status/gui', statusService.getILGStatus.bind(statusService), { public: true });
  http.get('/getFrameworkInfo', statusService.frameworkInfo.bind(statusService));

  http.get('/getUserProfile', (req, res) => profileService.getUserProfile(req, res));
  http.get('/getProfile', (req, res) => profileService.getProfile(req, res));
  http.post('/saveUserProfile', (req, res) => profileService.saveUserProfile(req, res));

  if (config.mysql) {
    logger.info('[API] Detected InfoLogger database configuration');
    setupMySQLConnectors();
    setInterval(() => {
      if (!querySource) {
        setupMySQLConnectors();
      }
    }, config.mysql.retryMs || 5000);
  } else {
    logger.warn('[API] InfoLogger database config not found, Query mode not available');
  }

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

  /**
   * Method to attempt creating a connection to the InfoLogger SQL DB
   */
  function setupMySQLConnectors() {
    const connector = new MySQL(config.mysql);
    connector.testConnection().then(() => {
      querySource = new SQLDataSource(connector, config.mysql);
      querySource.isConnectionUpAndRunning()
        .then(() => {
          ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-sql-server-status').setPayload({ ok: true }));
          statusService.setQuerySource(querySource);
          queryController.queryService = querySource;
        }).catch((error) => {
          logger.error(`[API] Unable to instantiate data source due to ${error}`);
          ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-sql-server-status')
            .setPayload({ ok: false, message: 'Query service is unavailable' }));
          querySource = null;
          statusService.setQuerySource(querySource);
        });
    }).catch((error) => {
      logger.error(`[API] Unable to connect to mysql due to ${error}`);
      querySource = null;
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-sql-server-status')
        .setPayload({ ok: false, message: 'Query service is unavailable' }));
      statusService.setQuerySource(querySource);
    });
  }

  /**
   * Method to perform a query on the SQL Data Source
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  function query(req, res) {
    if (querySource) {
      querySource.queryFromFilters(req.body.criterias, req.body.options)
        .then((result) => res.json(result))
        .catch((error) => {
          setupMySQLConnectors();
          handleError(res, error);
        });
    } else {
      handleError(res, '[API] MySQL Data Source is currently not available');
    }
  }

  /**
   * Catch all HTTP errors
   * @param {Response} res - HTTP Response object
   * @param {Error} error - Error object to handle and send
   * @param {number} status - HTTP status code to send
   */
  function handleError(res, error, status = 500) {
    logger.trace(error);
    res.status(status).json({ message: error.message });
  }
};
