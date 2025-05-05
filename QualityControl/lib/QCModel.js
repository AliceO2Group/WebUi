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

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

import { openFile, toJSON } from 'jsroot';

import { CcdbService } from './services/ccdb/CcdbService.js';
import { IntervalsService } from './services/Intervals.service.js';
import { StatusService } from './services/Status.service.js';
import { QcObjectService } from './services/QcObject.service.js';
import { UserService } from './services/UserService.js';

import { LayoutController } from './controllers/LayoutController.js';
import { StatusController } from './controllers/StatusController.js';
import { ObjectController } from './controllers/ObjectController.js';
import { UserController } from './controllers/UserController.js';

import { config } from './config/configProvider.js';
import { initDatabase } from './database/index.js';
import { SequelizeDatabase } from './database/SequelizeDatabase.js';
import { setupRepositories } from './database/repositories/index.js';
import { LayoutService } from './services/LayoutService.js';

/**
 * Model initialization for the QCG application
 * @returns {Promise<object>} Multiple services and controllers that are to be used by the QCG application
 */
export const setupQcModel = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJSON = JSON.parse(readFileSync(`${__dirname}/../package.json`));

  const dbConfig = config?.database || {};
  const sequelizeDatabase = new SequelizeDatabase(dbConfig);
  await initDatabase(sequelizeDatabase, dbConfig);

  const repositories = setupRepositories(sequelizeDatabase);
  const {
    userRepository,
    layoutRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionRepository,
    optionRepository,
  } = repositories;

  const userService = new UserService(userRepository);
  const layoutService = new LayoutService(
    userRepository,
    layoutRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionRepository,
    optionRepository,
  );

  const userController = new UserController(userService);
  const layoutController = new LayoutController(layoutService);

  const statusService = new StatusService({ version: packageJSON?.version ?? '-' }, { qc: config.qc ?? {} });
  const statusController = new StatusController(statusService);

  const ccdbService = CcdbService.setup(config.ccdb);
  statusService.dataService = ccdbService;

  const qcObjectService = new QcObjectService(ccdbService, layoutService, { openFile, toJSON });
  qcObjectService.refreshCache();

  const objectController = new ObjectController(qcObjectService);
  const intervalsService = new IntervalsService();

  intervalsService.register(
    qcObjectService.refreshCache.bind(qcObjectService),
    qcObjectService.getCacheRefreshRate(),
  );
  return {
    userController,
    layoutController,
    statusService,
    statusController,
    objectController,
    intervalsService,
    layoutService,
  };
};
