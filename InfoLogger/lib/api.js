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

  /**
   * Catch all HTTP errors
   * @param {Object} res
   * @param {Error} error
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
