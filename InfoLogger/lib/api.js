const {log, WebSocketMessage} = require('@aliceo2/web-ui');
const config = require('./configProvider.js');
const SQLDataSource = require('./SQLDataSource.js');
const LiveDataSource = require('./LiveDataSource.js');

let querySource = null;
let liveSource = null;

if (config.mysql) {
  log.info(`MySQL config found, connecting to SQL source`);
  querySource = new SQLDataSource(config.mysql);
} else {
  log.info(`MySQL config not found, continue without SQL source`);
}

if (config.infoLoggerServer) {
  log.info(`InfoLogger config found, connecting to live source`);
  liveSource = new LiveDataSource();
  liveSource.connect(config.infoLoggerServer);
} else {
  log.info(`InfoLogger config not found, continue without live source`);
}

module.exports.attachTo = (http, ws) => {
  // expose available services
  http.post('/services', (req, res) => {
    res.json({query: !!querySource, live: !!liveSource});
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
