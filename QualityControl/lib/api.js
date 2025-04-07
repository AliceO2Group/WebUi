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

import { setupQcModel } from './QCModel.js';
import { minimumRoleMiddleware } from './middleware/minimumRole.middleware.js';
import { UserRole } from './../common/library/userRole.enum.js';
import { layoutOwnerMiddleware } from './middleware/layouts/layoutOwner.middleware.js';
import { layoutIdMiddleware } from './middleware/layouts/layoutId.middleware.js';
import { layoutServiceMiddleware } from './middleware/layouts/layoutService.middleware.js';
import { statusComponentMiddleware } from './middleware/status/statusComponent.middleware.js';

/**
 * Adds paths and binds websocket to instance of HttpServer passed
 * @param {HttpServer} http - web-ui based server implementation
 * @param {WebSocket} ws - web-ui websocket server implementation
 * @returns {void}
 */
export const setup = (http, ws) => {
  /**
   * @type {{
   *   layoutController: import('./controllers/LayoutController.js').LayoutController,
   *   objectController: import('./controllers/ObjectController.js').ObjectController,
   *   statusController: import('./controllers/StatusController.js').StatusController,
   *   statusService: import('./services/statusService').StatusService,
   *   userController: import('./controllers/UserController.js').UserController,
   *   jsonFileService: import('./services/JsonFileService.js').JsonFileService
   * }}
   */
  const {
    layoutController,
    objectController,
    statusController,
    statusService,
    userController,
    layoutRepository,
    jsonFileService,
  } = setupQcModel();
  statusService.ws = ws;
  http.get('/object/:id', objectController.getObjectById.bind(objectController));
  http.get('/object', objectController.getObjectContent.bind(objectController));
  http.get('/objects', objectController.getObjects.bind(objectController), { public: true });

  http.get('/layouts', layoutController.getLayoutsHandler.bind(layoutController));
  http.get('/layout/:id', layoutController.getLayoutHandler.bind(layoutController));
  http.get('/layout', layoutController.getLayoutByNameHandler.bind(layoutController));
  http.post('/layout', layoutController.postLayoutHandler.bind(layoutController));
  http.put(
    '/layout/:id',
    layoutServiceMiddleware(jsonFileService),
    layoutIdMiddleware(layoutRepository),
    layoutOwnerMiddleware(layoutRepository),
    layoutController.putLayoutHandler.bind(layoutController),
  );
  http.patch(
    '/layout/:id',
    layoutServiceMiddleware(jsonFileService),
    layoutIdMiddleware(layoutRepository),
    minimumRoleMiddleware(UserRole.GLOBAL),
    layoutController.patchLayoutHandler.bind(layoutController),
  );
  http.delete(
    '/layout/:id',
    layoutServiceMiddleware(jsonFileService),
    layoutIdMiddleware(layoutRepository),
    layoutOwnerMiddleware(layoutRepository),
    layoutController.deleteLayoutHandler.bind(layoutController),
  );

  http.get('/status/gui', statusController.getQCGStatus.bind(statusController), { public: true });
  http.get(
    '/status/:service',
    statusComponentMiddleware,
    statusController.serviceStatusHandler.bind(statusController),
    { public: true },
  );

  http.get('/checkUser', userController.addUserHandler.bind(userController));
};
