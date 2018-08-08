const {log, WebSocketMessage} = require('@aliceo2/web-ui');
const config = require('./configProvider.js');
const SQLDataSource = require('./SQLDataSource.js');
const InfoLoggerReceiver = log.InfoLoggerReceiver;

let querySource = null;
let liveSource = null;

if (config.mysql) {
  log.info(`Detected InfoLogger database configration`);
  querySource = new SQLDataSource(config.mysql);
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
  }
};
