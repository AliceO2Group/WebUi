const {Log, WebSocketMessage, InfoLoggerReceiver} = require('@aliceo2/web-ui');
const log = new Log('InfoLogger');
const config = require('./configProvider.js');
const SQLDataSource = require('./SQLDataSource.js');
const {MySQL} = require('@aliceo2/web-ui');

let querySource = null;
let liveSource = null;

if (config.mysql) {
  log.info(`Detected InfoLogger database configration`);
  const connection = new MySQL(config.mysql);
  querySource = new SQLDataSource(connection, config.mysql);
  querySource.isConnectionUpAndRunning();
} else {
  log.warn(`InfoLogger databse config not found, Query mode not available`);
}

if (config.infoLoggerServer) {
  log.info(`InfoLogger server config found`);
  liveSource = new InfoLoggerReceiver();
  liveSource.connect(config.infoLoggerServer);
} else {
  log.warn(`InfoLogger server config not found, Live mode not available`);
}

module.exports.attachTo = (http, ws) => {
  // expose available services
  http.post('/services', (req, res) => {
    res.json({
      query: !!querySource,
      live: !!liveSource,
      streamHostname: config.infoLoggerServer && config.infoLoggerServer.host
    });
  });

  http.post('/query', (req, res) => {
    querySource.queryFromFilters(req.body.criterias, req.body.options)
      .then((result) => res.json(result))
      .catch((error) => handleError(res, error));
  });

  http.get('/getFrameworkInfo', getFrameworkInfo);

  http.get('/getUserProfile', getUserProfile);

  http.post('/saveUserProfile', saveUserProfile);

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
      if (process.env.npm_package_version) {
        result['infoLogger-gui'].version = process.env.npm_package_version;
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
   * Method which handles the request for the user profile
   * @param {Request} req
   * @param {Response} res
   */
  function getUserProfile(req, res) {
    // const user = requ.body
  }

  /**
 * Method which handles the request for saving the user profile
 * @param {Request} req
 * @param {Response} res
 */
  function saveUserProfile(req, res) {
    const user = req.body.user;
    const profile = req.body.profile;
    console.log("USER")
    console.log(user)
    console.log("Profile")
    console.log(profile)
  }

  /**
   * Catch all HTTP errors
   * @param {Object} res
   * @param {Error} error
   * @param {number} status
   */
  function handleError(res, error) {
    log.trace(error);
    res.status(500).json({message: error.message});
  }

  if (liveSource) {
    liveSource.on('message', (message) => {
      const msg = new WebSocketMessage();
      msg.command = 'live-log';
      msg.payload = message;
      ws.broadcast(msg);
    });

    liveSource.on('close', () => {
      ws.unfilteredBroadcast(new WebSocketMessage().setCommand('il-server-close'));
    });
  }
};
