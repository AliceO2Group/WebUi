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

const {Log, WebSocket} = require('@aliceo2/web-ui');
const config = require('./configProvider.js');
const projPackage = require('./../package.json');
const log = new Log('QualityControl');

// Load data source (demo or DB)
const model = config.demoData ? require('./QCModelDemo.js') : require('./QCModel.js');

/**
 * Adds paths and binds websocket to instance of HttpServer passed
 * @param {HttpServer} http
 */
module.exports.setup = (http) => {
  http.get('/readObjectData', readObjectData, {public: true});
  http.post('/readObjectsData', readObjectsData);
  http.get('/listObjects', listObjects, {public: true});
  http.get('/objectTimestampList', getObjectTimestampList, {public: true});
  http.get('/listOnlineObjects', listOnlineObjects);
  http.get('/isOnlineModeConnectionAlive', isOnlineModeConnectionAlive);
  http.post('/readLayout', model.layoutConnector.readLayout.bind(model.layoutConnector));
  http.post('/writeLayout', model.layoutConnector.updateLayout.bind(model.layoutConnector));
  http.post('/listLayouts', model.layoutConnector.listLayouts.bind(model.layoutConnector));
  http.delete('/layout/:layoutId', model.layoutConnector.deleteLayout.bind(model.layoutConnector));
  http.post('/layout', model.layoutConnector.createLayout.bind(model.layoutConnector));
  http.get('/getFrameworkInfo', getFrameworkInfo);
  new WebSocket(http);
};

/**
 * List all objects without data
 * @param {Request} req
 * @param {Response} res
 */
function listObjects(req, res) {
  model.listObjects()
    .then((data) => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * Method to retrieve a list of timestamps for the requested objectName
 * @param {Request} req
 * @param {Response} res
 */
function getObjectTimestampList(req, res) {
  model.getObjectTimestampList(req.query.objectName)
    .then((data) => {
      res.status(200);
      res.json(data);
    })
    .catch((err) => errorHandler(err, res));
}

/**
 * List all Online objects' name if online mode is enabled
 * @param {Request} req
 * @param {Response} res
 */
function listOnlineObjects(req, res) {
  if (typeof model.consulService !== 'undefined') {
    model.consulService.getServices()
      .then((services) => {
        const tags = getTagsFromServices(services);
        res.status(200).json(tags);
      })
      .catch((err) => errorHandler(err, res));
  } else {
    errorHandler('Online mode is not enabled due to missing Consul configuration', res, 503);
  }
}

/**
 * Check the state of OnlineMode by checking the status of Consul Leading Agent
 * @param {Request} req
 * @param {Response} res
 */
function isOnlineModeConnectionAlive(req, res) {
  if (typeof model.consulService !== 'undefined') {
    model.consulService.getConsulLeaderStatus()
      .then(() => res.status(200).json({running: true}))
      .catch((err) => errorHandler(`Unable to retrieve Consul Status: ${err}`, res));
  } else {
    errorHandler('Online mode is not enabled due to missing Consul configuration', res, 503);
  }
}

/**
 * List objects with data specified by objectName[]
 * Send back array of objects or {error: ...}
 * @param {Request} req
 * @param {Response} res
 */
function readObjectsData(req, res) {
  let objectsNames = req.body.objectsNames;

  if (!objectsNames) {
    res.status(400).send('parameter objectsNames is needed');
    return;
  }

  if (!Array.isArray(objectsNames)) {
    objectsNames = [objectsNames];
  }

  /**
   * Retrieves data or provides {error} object on failure
   * @param {Object} name - name path of object and its agent
   * @return {Promise.<Object>}
   */
  const safeRetriever = (name) => model.readObjectData(name)
    .then((data) => !data ? {error: 'Object not found'} : {qcObject: data})
    .catch((err) => ({error: err.toString()}));

  const promiseArray = objectsNames.map(safeRetriever);
  Promise.all(promiseArray)
    .then((results) => {
      const resultsByName = {};
      objectsNames.forEach((name, i) => {
        resultsByName[name] = results[i];
      });
      res.status(200).json(resultsByName);
    })
    .catch((err) => errorHandler(err, res));
}

/**
 * Read only data of an object specified by objectName
 * @param {Request} req
 * @param {Response} res
 */
async function readObjectData(req, res) {
  const objectName = req.query.objectName;
  let timestamp = -1;
  if (req.query.timestamp) {
    const ts = req.query.timestamp;
    timestamp = typeof ts === 'string' ? parseInt(ts) : ts;
  }
  if (!objectName) {
    res.status(400).send('parameter objectName is needed');
    return;
  }

  // Read from QC
  try {
    const qcObject = await model.readObjectData(objectName, timestamp);
    const timestamps = await model.getObjectTimestampList(objectName);
    res.status(qcObject ? 200 : 404).json({qcObject: qcObject, timestamps: timestamps.slice(0, 20)});
  } catch (err) {
    errorHandler('Reading object data: ' + err, res);
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
    result.qcg = {};

    if (projPackage && projPackage.version) {
      result.qcg.version = projPackage.version;
    }
    if (config.http) {
      const qc = {hostname: config.http.hostname, port: config.http.port};
      result.qcg = Object.assign(result.qcg, qc);
    }
    if (config.ccdb) {
      result.ccdb = config.ccdb;
    }
    if (config.consul) {
      result.consul = config.consul;
    }
    if (config.quality_control) {
      result.quality_control = config.quality_control;
    }
    res.status(200).json(result);
  }
}

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (status === 500) {
    if (err.stack) {
      log.trace(err);
    }
    log.error(err.message || err);
  }
  res.status(status).send({message: err.message || err});
}

/**
 * Helpers
 */

/**
 * Method to extract the tags (with a specified prefix) from a list of services.
 * This represents objects that are in online mode
 * @param {JSON} services
 * @return {Array<JSON>} [{ name: tag1 }, { name: tag2 }]
 */
function getTagsFromServices(services) {
  const prefix = model.queryPrefix;
  const tags = [];
  for (const serviceName in services) {
    if (services[serviceName] && services[serviceName].Tags && services[serviceName].Tags.length > 0) {
      const tagsToBeAdded = services[serviceName].Tags;
      tagsToBeAdded.filter((tag) => tag.startsWith(prefix))
        .forEach((tag) => tags.push({name: tag}));
    }
  }
  return tags;
}
