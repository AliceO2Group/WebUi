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

import { Log, WebSocket } from '@aliceo2/web-ui';
import { config } from './config/configProvider.js';

const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/api`);

// Load data source (demo or DB)
const model = config.demoData ? await import('./QCModelDemo.js') : await import('./QCModel.js');
import {
  queryPrefix, listObjects, consulService, objectController, layoutService, statusService, userService,
} from './QCModel.js';

/**
 * Adds paths and binds websocket to instance of HttpServer passed
 * @param {HttpServer} http - web-ui based server implementation
 * @returns {void}
 */
export const setup = (http) => {
  http.get('/object/info', model.objectController.getObjectInfo.bind(model.objectController), { public: true });
  http.get('/object', objectController.getObjectContent.bind(objectController));
  http.get('/objects', () => false, { public: true });

  http.get('/listOnlineObjects', listOnlineObjects);
  http.get('/isOnlineModeConnectionAlive', isOnlineModeConnectionAlive);

  http.get('/layouts', layoutService.listLayouts.bind(layoutService));
  http.get('/layout/:id', layoutService.readLayout.bind(layoutService));
  http.delete('/layout/:id', layoutService.deleteLayout.bind(layoutService));
  http.post('/layout', layoutService.createLayout.bind(layoutService));
  http.post('/writeLayout', layoutService.updateLayout.bind(layoutService));

  http.get('/status/gui', statusService.getQCGStatus.bind(statusService), { public: true });
  http.get('/getFrameworkInfo', statusService.frameworkInfo.bind(statusService), { public: true });

  http.get('/checkUser', userService.addUser.bind(userService));

  new WebSocket(http);

  /**
   *  @deprecated ; to be removed in version 2.14.0
   */
  http.get('/listObjects', listObjectsTwo, { public: true });
};

/**
 * List all objects without data
 * @param {Request} req - HTTP request object with information on owner_id
 * @param {Response} res - HTTP response object to provide layouts information
 * @return {undefined}
 */
function listObjectsTwo(req, res) {
  listObjects()
    .then((data) => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * List all Online objects' name if online mode is enabled
 * @param {Request} req - HTTP request object with information on owner_id
 * @param {Response} res - HTTP response object to provide layouts information
 * @return {undefined}
 */
function listOnlineObjects(req, res) {
  if (typeof consulService !== 'undefined') {
    consulService.getServices()
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
 * @param {Request} req - HTTP request object with information on owner_id
 * @param {Response} res - HTTP response object to provide layouts information
 * @return {undefined}
 */
function isOnlineModeConnectionAlive(req, res) {
  if (typeof consulService !== 'undefined') {
    consulService.getConsulLeaderStatus()
      .then(() => res.status(200).json({ running: true }))
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
 * @returns {undefined}
 */
function errorHandler(err, res, status = 500) {
  if (err.stack) {
    log.trace(err);
  }
  log.error(err.message || err);
  res.status(status).send({ message: err.message || err });
}

/**
 * Helpers
 */

/**
 * Method to extract the tags (with a specified prefix) from a list of services.
 * This represents objects that are in online mode
 * @param {JSON} services - services as per ConsulService
 * @return {Array<JSON>} [{ name: tag1 }, { name: tag2 }]
 */
function getTagsFromServices(services) {
  const prefix = queryPrefix;
  const tags = Object.values(services)
    .flat()
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => ({ name: tag }));
  return tags;
}
