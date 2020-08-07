const {Log, WebSocketMessage, InfoLoggerReceiver} = require('@aliceo2/web-ui');
const log = new Log('InfoLogger');
const config = require('./configProvider.js');
const SQLDataSource = require('./SQLDataSource.js');
const ProfileService = require('./ProfileService.js');
const {MySQL} = require('@aliceo2/web-ui');
const JsonFileConnector = require('./JSONFileConnector.js');
const projPackage = require('./../package.json');
const SQLiteConnector = require('./SQLiteConnector.js');

let querySource = null;
let liveSource = null;

let profileService = null;

const jsonDb = new JsonFileConnector(config.dbFile || __dirname + '/../db.json');
const sqliteDb = new SQLiteConnector(__dirname + '/../INFOLOGGER;');
sqliteDb.init();
sqliteDb.testConnection().then(()=> {
  profileService = new ProfileService(jsonDb, sqliteDb);
}).catch((err) => {
  log.error(err.message);
});


if (config.mysql) {
  log.info(`Detected InfoLogger database configration`);
  const connector = new MySQL(config.mysql);
  connector.testConnection().then(() => {
    querySource = new SQLDataSource(connector, config.mysql);
    querySource.isConnectionUpAndRunning().catch((error) => {
      log.error(`Unable to instantiate data source due to ${error}`);
      querySource = null;
    });
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
} else {
  log.warn(`InfoLogger server config not found, Live mode not available`);
}

module.exports.attachTo = (http, ws) => {
  http.get('/getFrameworkInfo', getFrameworkInfo);
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
      live: !!liveSource,
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
   * Method which handles the request for framework information
   * @param {Request} req
   * @param {Response} res
   */
  function getFrameworkInfo(req, res) {
    if (!config) {
      handleError(res, 'Unable to retrieve configuration of the framework', 502);
    } else {
      const result = {};
      result['infoLogger-gui'] = {};
      if (projPackage && projPackage.version) {
        result['infoLogger-gui'].version = projPackage.version;
      }
      if (config.http) {
        const il = {hostname: config.http.hostname, port: config.http.port};
        result['infoLogger-gui'] = Object.assign(result['infoLogger-gui'], il);
      }
      if (config.infoLoggerServer) {
        const ils = {host: config.infoLoggerServer.host, port: config.infoLoggerServer.port};
        result.infoLoggerServer = ils;
      }
      res.status(200).json(result);
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
