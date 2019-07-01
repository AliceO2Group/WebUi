const {WebSocketMessage} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)('Control');

const Padlock = require('./Padlock.js');
const ControlProxy = require('./ControlProxy.js');
const KafkaConnector = require('../lib/KafkaConnector.js');

const config = require('./configProvider.js');
const http = require('http');

if (!config.grpc) {
  throw new Error('grpc field in config file is needed');
}
if (!config.grafana) {
  log.error('Grafana configuration missing');
}

const pad = new Padlock();
const octl = new ControlProxy(config.grpc);
const kafka = new KafkaConnector(config.kafka);

module.exports.setup = (http, ws) => {
  // Map Control gRPC methods
  for (const method of octl.methods) {
    http.post(`/${method}`, (req, res) => {
      if (!octl.connectionReady) {
        errorHandler(`Could not establish gRPC connection to Control-Core`, res, 503);
        return;
      }
      // disallow 'not-Get' methods if not owning the lock
      if (!method.startsWith('Get')) {
        if (pad.lockedBy == null) {
          errorHandler(`Control is not locked`, res, 403);
          return;
        }
        if (req.session.personid != pad.lockedBy) {
          errorHandler(`Control is locked by ${pad.lockedByName}`, res, 403);
          return;
        }
      }
      octl[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504));
    });
  }

  http.post('/lockState', (req, res) => {
    res.json(pad);
  });

  http.post('/lock', (req, res) => {
    try {
      pad.lockBy(req.session.personid, req.session.name);
      log.info(`Lock taken by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.toString()});
      return;
    }
    broadcastPadState();
  });

  http.post('/unlock', (req, res) => {
    try {
      pad.unlockBy(req.session.personid);
      log.info(`Lock released by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to give away lock by ${req.session.name}: ${error}`);
      res.status(403).json(error);
      return;
    }
    broadcastPadState();
  });

  http.get('/PlotsList', (req, res) => {
    if (!config.grafana || !config.http.hostname || !config.grafana.port) {
      log.error('Grafana configuration missing');
      res.status(403).json({message: 'Grafana configuration missing'});
    } else {
      const host = config.http.hostname;
      const port = config.grafana.port;
      httpGetJson(host, port, '/api/health')
        .then((result) => {
          log.info(`Grafana is up and running: ${result}`);
          const hostPort = `http://${host}:${port}/`;
          const valueOne = 'd-solo/uHUjCFiWk/readout?orgId=1&panelId=6 ';
          const valueTwo = 'd-solo/uHUjCFiWk/readout?orgId=1&panelId=4';
          const plot = 'd-solo/uHUjCFiWk/readout?orgId=1&panelId=5';
          const theme = '&refresh=5s&theme=light';
          const response =
            [
              hostPort + valueOne + theme,
              hostPort + valueTwo + theme,
              hostPort + plot + theme
            ];
          res.status(200).json(response);
        });
      return;
    }
  });

  /**
   * Send to all users state of Pad via Websocket
   */
  const broadcastPadState = () => {
    ws.broadcast(
      new WebSocketMessage().setCommand('padlock-update').setPayload(pad)
    );
  };
};

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (status > 500) {
    if (err.stack) {
      log.trace(err);
    }
    log.error(err.message || err);
  }
  res.status(status).send({message: err.message || err});
}

/**
  * Util to get JSON data (parsed) from server
  * @param {string} host - hostname of the server
  * @param {number} port - port of the server
  * @param {string} path - path of the server request
  * @return {Promise.<Object, Error>} JSON response
  */
function httpGetJson(host, port, path) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    };
    /**
     * Generic handler for client http requests,
     * buffers response, checks status code and parses JSON
     * @param {Response} response
     */
    const requestHandler = (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Non-2xx status code: ' + response.statusCode));
        return;
      }

      const bodyChunks = [];
      response.on('data', (chunk) => bodyChunks.push(chunk));
      response.on('end', () => {
        try {
          const body = JSON.parse(bodyChunks.join(''));
          resolve(body);
        } catch (e) {
          reject(new Error('Unable to parse JSON'));
        }
      });
    };

    const request = http.request(requestOptions, requestHandler);
    request.on('error', (err) => reject(err));
    request.end();
  });
}

/**
 * Check status of Kafka Producer
 * @param {Request} req
 * @param {Response} res
 */
function isKafkaRunning(req, res) {
  kafka.isKafkaProducerUpAndRunning()
    .then((data) => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
}
