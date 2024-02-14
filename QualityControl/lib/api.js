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

import {
  consulService, objectController, layoutService, statusController, userService, statusService,
} from './QCModel.js';
import { minimumRoleMiddleware } from './middleware/minimumRole.middleware.js';
import { UserRole } from './../common/library/userRole.enum.js';

/**
 * Adds paths and binds websocket to instance of HttpServer passed
 * @param {HttpServer} http - web-ui based server implementation
 * @param {WebSocket} ws - web-ui websocket server implementation
 * @returns {void}
 */
export const setup = (http, ws) => {
  statusService.ws = ws;
  http.get('/object/:id', objectController.getObjectById.bind(objectController));
  http.get('/object', objectController.getObjectContent.bind(objectController));
  http.get('/objects', objectController.getObjects.bind(objectController), { public: true });
  http.get('/objects/online', onlineMiddleware, objectController.getObjects.bind(objectController));
  http.get(
    '/isOnlineModeConnectionAlive',
    onlineMiddleware,
    objectController.isOnlineModeConnectionAlive.bind(objectController),
  );

  http.get('/layouts', layoutService.getLayoutsHandler.bind(layoutService));
  http.get('/layout/:id', layoutService.getLayoutHandler.bind(layoutService));
  http.post('/layout', layoutService.postLayoutHandler.bind(layoutService));
  http.put('/layout/:id', layoutService.putLayoutHandler.bind(layoutService));
  http.delete('/layout/:id', layoutService.deleteLayoutHandler.bind(layoutService));
  http.patch(
    '/layout/:id',
    minimumRoleMiddleware(UserRole.GLOBAL),
    layoutService.patchLayoutHandler.bind(layoutService),
  );

  http.get('/status/gui', statusController.getQCGStatus.bind(statusController), { public: true });
  http.get('/status/framework', statusController.getFrameworkInfo.bind(statusController), { public: true });

  http.get('/checkUser', userService.addUser.bind(userService));
};

/**
 * Method to check if consulService is configured and used
 * @param {Request} _ - HTTP request object with information on owner_id
 * @param {Response} res - HTTP response object to provide layouts information
 * @param {function} next - HTTP object for continuing chain of operations
 * @returns {undefined}
 */
const onlineMiddleware = (_, res, next) => {
  if (consulService !== undefined) {
    next();
  } else {
    res.status(502).json({ message: 'QC Online mode is not available' });
  }
};
