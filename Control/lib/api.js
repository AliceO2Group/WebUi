const {WebSocketMessage, ConsulService} = require('@aliceo2/web-ui');
const http = require('http');

const log = new (require('@aliceo2/web-ui').Log)('Control');
const errorHandler = require('./utils.js').errorHandler;

const Padlock = require('./Padlock.js');
const KafkaConnector = require('./KafkaConnector.js');

const ControlProxy = require('./control-core/ControlProxy.js');
const ControlService = require('./control-core/ControlService.js');

const ConsulConnector = require('./ConsulConnector.js');

const config = require('./configProvider.js');
const projPackage = require('./../package.json');

if (!config.grpc) {
  throw new Error('grpc field in config file is needed');
}
if (!config.grafana) {
  log.error('[Grafana] Configuration is missing');
}

let consulService;
let flpHardwarePath = undefined;
if (config.consul) {
  consulService = new ConsulService(config.consul);
  if (config.consul.flpHardwarePath) {
    flpHardwarePath = config.consul.flpHardwarePath;
  }
}
const consulConnector = new ConsulConnector(consulService, flpHardwarePath);
consulConnector.testConsulStatus();

const padLock = new Padlock();
const ctrlProxy = new ControlProxy(config.grpc);
const ctrlService = new ControlService(padLock, ctrlProxy);

module.exports.setup = (http, ws) => {
  ctrlProxy.methods.forEach((method) =>
    http.post(`/${method}`, (req, res) => ctrlService.executeCommand(req, res))
  );
  http.post('/executeRocCommand', (req, res) => ctrlService.executeRocCommand(req, res));
  http.post('/lockState', (req, res) => res.json(padLock));
  http.post('/lock', lock);
  http.post('/unlock', unlock);
  http.get('/getPlotsList', getPlotsList);
  http.get('/getFrameworkInfo', getFrameworkInfo);
  http.get('/getCRUs', (req, res) => consulConnector.getCRUs(req, res));
  http.get('/getFLPs', (req, res) => consulConnector.getFLPs(req, res));

  const kafka = new KafkaConnector(config.kafka, ws);
  if (kafka.isKafkaConfigured()) {
    kafka.initializeKafkaConsumerGroup();
  }

  /**
   * Send to all users state of Pad via Websocket
   */
  const broadcastPadState = () => {
    ws.broadcast(new WebSocketMessage().setCommand('padlock-update').setPayload(padLock));
  };

  /**
   * Method to try to acquire lock
   * @param {Request} req
   * @param {Response} res
   */
  function lock(req, res) {
    try {
      padLock.lockBy(req.session.personid, req.session.name);
      log.info(`Lock taken by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.toString()});
      return;
    }
    broadcastPadState();
  }

  /**
   * Method to try to release lock
   * @param {Request} req
   * @param {Response} res
   */
  function unlock(req, res) {
    try {
      padLock.unlockBy(req.session.personid);
      log.info(`Lock released by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to give away lock by ${req.session.name}: ${error}`);
      res.status(403).json(error);
      return;
    }
    broadcastPadState();
  }
};

/**
 * Method to build a list of plots source
 * @param {Request} req
 * @param {Response} res
 */
function getPlotsList(req, res) {
  if (!config.grafana || !config.http.hostname || !config.grafana.port) {
    log.error('[Grafana] Configuration is missing');
    res.status(503).json({message: 'Plots service configuration is missing'});
  } else {
    const host = config.http.hostname;
    const port = config.grafana.port;
    httpGetJson(host, port, '/api/health')
      .then((result) => {
        log.info(`Grafana is up and running on version: ${result.version}`);
        const hostPort = `http://${host}:${port}/`;
        const valueOne = 'd-solo/TZsAxKIWk/readout?orgId=1&panelId=6 ';
        const valueTwo = 'd-solo/TZsAxKIWk/readout?orgId=1&panelId=8';
        const plot = 'd-solo/TZsAxKIWk/readout?orgId=1&panelId=4';
        const theme = '&refresh=5s&theme=light';
        const response = [hostPort + valueOne + theme, hostPort + valueTwo + theme, hostPort + plot + theme];
        res.status(200).json(response);
      })
      .catch((error) => errorHandler(`[Grafana] - Unable to connect due to ${error}`, res, 503));
    return;
  }
}

/**
 * Send back info about the framework
 * @param {Request} req
 * @param {Response} res
 */
function getFrameworkInfo(req, res) {
  if (!config) {
    errorHandler('Unable to retrieve configuration of the framework', res, 502);
  } else {
    const result = {};
    result['control-gui'] = {};
    if (projPackage && projPackage.version) {
      result['control-gui'].version = projPackage.version;
    }
    if (config.http) {
      const con = {hostname: config.http.hostname, port: config.http.port};
      result['control-gui'] = Object.assign(result['control-gui'], con);
    }
    if (config.grpc) {
      result.grpc = config.grpc;
    }
    if (config.grafana) {
      result.grafana = config.grafana;
    }
    if (config.kafka) {
      result.kafka = config.kafka;
    }
    res.status(200).json(result);
  }
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
