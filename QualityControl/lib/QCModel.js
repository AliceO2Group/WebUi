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

import { LayoutController } from './controllers/LayoutController.js';
import { StatusController } from './controllers/StatusController.js';
import { ObjectController } from './controllers/ObjectController.js';
import { UserController } from './controllers/UserController.js';

import { config } from './config/configProvider.js';
import { UserService } from './services/UserService.js';
import { initDatabase, SequelizeDatabase } from './database/index.js';
import { UserRepository } from './database/repositories/UserRepository.js';
import { TabRepository } from './database/repositories/TabRepository.js';
import { LayoutRepository } from './database/repositories/LayoutRepository.js';
import { ChartRepository } from './database/repositories/ChartRepository.js';
import { GridTabCellRepository } from './database/repositories/GridTabCellRepository.js';
import { ChartOptionsRepository } from './database/repositories/ChartOptionsRepository.js';
import { OptionRepository } from './database/repositories/OptionRepository.js';
import { LayoutService } from './services/LayoutService.js';

/**
 * Model initialization for the QCG application
 * @returns {Promise<object>} Multiple services and controllers that are to be used by the QCG application
 */
export const setupQcModel = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJSON = JSON.parse(readFileSync(`${__dirname}/../package.json`));

  const sequelizeDatabase = new SequelizeDatabase(config.database);
  await initDatabase(sequelizeDatabase);

  //Database models initialization
  const { User, Layout, Tab, GridTabCell, Chart, ChartOption, Option } = sequelizeDatabase.models;

  // Repositories initialization
  const userRepository = new UserRepository(User);
  const layoutRepository = new LayoutRepository(Layout);
  const tabRepository = new TabRepository(Tab);
  const gridTabCellRepository = new GridTabCellRepository(GridTabCell);
  const chartRepository = new ChartRepository(Chart);
  const chartOptionRepository = new ChartOptionsRepository(ChartOption);
  const optionRepository = new OptionRepository(Option);

  // Services initialization
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
  const statusService = new StatusService({ version: packageJSON?.version ?? '-' }, { qc: config.qc ?? {} });
  const ccdbService = CcdbService.setup(config.ccdb);
  const qcObjectService = new QcObjectService(ccdbService, layoutService, { openFile, toJSON });
  const intervalsService = new IntervalsService();

  // Controllers initialization
  const userController = new UserController(userService);
  const layoutController = new LayoutController(layoutService);
  const statusController = new StatusController(statusService);
  const objectController = new ObjectController(qcObjectService);

  statusService.dataService = ccdbService;
  qcObjectService.refreshCache();

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
    layoutRepository,
    layoutService,
  };
};
