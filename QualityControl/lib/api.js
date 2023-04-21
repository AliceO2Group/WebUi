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

import { WebSocket } from '@aliceo2/web-ui';

import { consulService, objectController, layoutService, statusService, userService } from './QCModel.js';

/**
 * Adds paths and binds websocket to instance of HttpServer passed
 * @param {HttpServer} http - web-ui based server implementation
 * @returns {void}
 */
export const setup = (http) => {
  http.get('/objects/:id', objectController.getObjectById.bind(objectController));
  http.get('/objects', objectController.getObjectContent.bind(objectController));
  http.get('/objects/all', objectController.getObjects.bind(objectController), { public: true });

  http.get('/objects/all/online', onlineMiddleware, objectController.getObjects.bind(objectController));
  http.get(
    '/isOnlineModeConnectionAlive',
    onlineMiddleware,
    objectController.isOnlineModeConnectionAlive.bind(objectController),
  );

  http.get('/layouts', layoutService.listLayouts.bind(layoutService));
  http.get('/layout/:id', layoutService.readLayout.bind(layoutService));
  http.delete('/layout/:id', layoutService.deleteLayout.bind(layoutService));
  http.post('/layout', layoutService.createLayout.bind(layoutService));
  http.post('/writeLayout', layoutService.updateLayout.bind(layoutService));

  http.get('/status/gui', statusService.getQCGStatus.bind(statusService), { public: true });
  http.get('/getFrameworkInfo', statusService.frameworkInfo.bind(statusService), { public: true });

  http.get('/checkUser', userService.addUser.bind(userService));

  new WebSocket(http);
};

/**
 * Method to check if consulService is configured and used
 * @param {Request} _ - HTTP request object with information on owner_id
 * @param {Response} res - HTTP response object to provide layouts information
 * @param {Next} next - HTTP object for continuing chain of operations
 * @returns {undefined}
 */
const onlineMiddleware = (_, res, next) => {
  if (consulService !== undefined) {
    next();
  } else {
    res.status(502).json({ message: 'QC Online mode is not available' });
  }
};
