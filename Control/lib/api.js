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
if (config.consul) {
  consulService = new ConsulService(config.consul);
}
const consulConnector = new ConsulConnector(consulService, config.consul);
consulConnector.testConsulStatus();

const padLock = new Padlock();
const ctrlProxy = new ControlProxy(config.grpc);
const ctrlService = new ControlService(padLock, ctrlProxy, consulConnector);

module.exports.setup = (http, ws) => { 
  ctrlService.setWS(ws);
  
  ctrlProxy.methods.forEach((method) =>
    http.post(`/${method}`, (req, res) => ctrlService.executeCommand(req, res))
  );
  http.post('/clean/resources', (req, res) => ctrlService.cleanResources(req, res));
  http.post('/executeRocCommand', (req, res) => ctrlService.executeRocCommand(req, res));
  http.post('/lockState', (req, res) => res.json(padLock));
  http.post('/lock', lock);
  http.post('/unlock', unlock);
  http.post('/forceUnlock', forceUnlock);
  http.get('/getPlotsList', getPlotsList);
  http.get('/getFrameworkInfo', getFrameworkInfo);
  http.get('/getInfoLoggerUrl', getInfoLoggerUrl);
  http.get('/getCRUs', (req, res) => consulConnector.getCRUs(req, res));
  http.get('/getFLPs', (req, res) => consulConnector.getFLPs(req, res));
  http.get('/getCRUsConfig', (req, res) => consulConnector.getCRUsWithConfiguration(req, res));
  http.post('/saveCRUsConfig', (req, res) => consulConnector.saveCRUsConfiguration(req, res));

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
      res.status(200).json({ok: true});
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
  function forceUnlock(req, res) {
    try {
      padLock.forceUnlock(req.session.access);
      log.info(`Lock forced by ${req.session.name}`);
      res.status(200).json({ok: true});
    } catch (error) {
      log.warn(`Unable to force lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
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
      res.status(200).json({ok: true});
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
async function getFrameworkInfo(req, res) {
  if (!config) {
    errorHandler('Unable to retrieve configuration of the framework', res, 502);
  } else {
    const result = {};
    result['AliECS GUI'] = {};
    if (projPackage && projPackage.version) {
      result['AliECS GUI'].version = projPackage.version;
    }
    if (config.http) {
      const con = {hostname: config.http.hostname, port: config.http.port};
      result['AliECS GUI'] = Object.assign(result['AliECS GUI'], con);
      result['AliECS GUI'].status = {ok: true};
    }
    if (config.grpc) {
      result['AliECS Core'] = config.grpc;
      try {
        const coreInfo = await ctrlService.getAliECSInfo();
        result['AliECS Core'] = Object.assign({}, result['AliECS Core'], coreInfo);
        result['AliECS Core'].status = {ok: true};
      } catch (err) {
        log.error(err);
        result['AliECS Core'].status = {ok: false};
        result['AliECS Core'].status.message = err.toString();
      }
    }
    if (config.grafana) {
      result.grafana = config.grafana;
      result.grafana.status = {};
      await httpGetJson(config.http.hostname, config.grafana.port, '/api/health')
        .then((_result) => result.grafana.status.ok = true)
        .catch((error) => {
          result.grafana.status.ok = false; result.grafana.status.message = error.toString();
        });
    }
    if (config.kafka) {
      result.kafka = config.kafka;
      result.kafka.status = {};
      await httpGetJson(config.kafka.hostname, config.kafka.port, '/api/health')
        .then((_result) => result.kafka.status.ok = true)
        .catch((error) => {
          result.kafka.status.ok = false; result.kafka.status.message = error.toString();
        });
    }
    if (config.consul) {
      result.consul = config.consul;
      result.consul.status = {};
      await consulService.getConsulLeaderStatus()
        .then((_data) => result.consul.status.ok = true)
        .catch((error) => {
          result.consul.status.ok = false; result.consul.status.message = error.toString();
        });
    }

    res.status(200).json(result);
  }
}

/**
 * Build the URL of infologger gui from the configuration file
 * @param {Request} _
 * @param {Response} res
 */
function getInfoLoggerUrl(_, res) {
  const ilg = config.infoLoggerGui;
  if (ilg && ilg.hostname && ilg.port) {
    res.status(200).json({ilg: `${ilg.hostname}:${ilg.port}`});
  } else {
    res.status(502).json({ilg: ''});
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
