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
const config = require('./config/configProvider.js');
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/api`);

// Load data source (demo or DB)
const model = config.demoData ? require('./QCModelDemo.js') : require('./QCModel.js');

/**
 * Adds paths and binds websocket to instance of HttpServer passed
 * @param {HttpServer} http
 */
module.exports.setup = (http) => {
  // http.get('/object/info', model.objectController.getObjectInfo.bind(model.objectController), {public: true});
  http.get('/object', model.objectController.getObjectContent.bind(model.objectController));
  http.get('/objects', () => false, {public: true});

  http.get('/listOnlineObjects', listOnlineObjects);
  http.get('/isOnlineModeConnectionAlive', isOnlineModeConnectionAlive);

  http.get('/layouts', model.layoutService.listLayouts.bind(model.layoutService));
  http.get('/layout/:id', model.layoutService.readLayout.bind(model.layoutService));
  http.delete('/layout/:id', model.layoutService.deleteLayout.bind(model.layoutService));
  http.post('/layout', model.layoutService.createLayout.bind(model.layoutService));
  http.post('/writeLayout', model.layoutService.updateLayout.bind(model.layoutService));

  http.get('/status/gui', model.statusService.getQCGStatus.bind(model.statusService), {public: true});
  http.get('/getFrameworkInfo', model.statusService.frameworkInfo.bind(model.statusService), {public: true});

  http.get('/checkUser', model.userService.addUser.bind(model.userService));

  new WebSocket(http);

  /**
   *  @deprecated ; to be removed in version 2.14.0
   */
  http.get('/listObjects', listObjects, {public: true});
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
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (err.stack) {
    log.trace(err);
  }
  log.error(err.message || err);
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
  const tags = Object.values(services)
    .flat()
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => ({name: tag}));
  return tags;
}
