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
import { JsonFileService } from './services/JsonFileService.js';
import { QcObjectService } from './services/QcObject.service.js';
import { BookkeepingService } from './services/BookkeepingService.js';

import { LayoutController } from './controllers/LayoutController.js';
import { StatusController } from './controllers/StatusController.js';
import { ObjectController } from './controllers/ObjectController.js';
import { FilterController } from './controllers/FilterController.js';
import { UserController } from './controllers/UserController.js';

import { config } from './config/configProvider.js';
import { LayoutRepository } from './repositories/LayoutRepository.js';
import { UserRepository } from './repositories/UserRepository.js';
import { ChartRepository } from './repositories/ChartRepository.js';
import { initDatabase } from './database/index.js';
import { SequelizeDatabase } from './database/SequelizeDatabase.js';
import { FilterService } from './services/FilterService.js';

/**
 * Model initialization for the QCG application
 * @returns {Promise<object>} Multiple services and controllers that are to be used by the QCG application
 */
export const setupQcModel = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJSON = JSON.parse(readFileSync(`${__dirname}/../package.json`));

  const jsonFileService = new JsonFileService(config.dbFile || `${__dirname}/../db.json`);
  initDatabase(new SequelizeDatabase(config?.database || {}));

  const layoutRepository = new LayoutRepository(jsonFileService);
  const userRepository = new UserRepository(jsonFileService);
  const chartRepository = new ChartRepository(jsonFileService);

  const userController = new UserController(userRepository);
  const layoutController = new LayoutController(layoutRepository);

  const statusService = new StatusService({ version: packageJSON?.version ?? '-' }, { qc: config.qc ?? {} });
  const statusController = new StatusController(statusService);

  const ccdbService = CcdbService.setup(config.ccdb);
  statusService.dataService = ccdbService;

  const qcObjectService = new QcObjectService(ccdbService, chartRepository, { openFile, toJSON });
  qcObjectService.refreshCache();

  const objectController = new ObjectController(qcObjectService);
  const intervalsService = new IntervalsService();

  const bookkeepingService = new BookkeepingService(config.bookkeeping);
  const filterService = new FilterService(bookkeepingService);

  const filterController = new FilterController(filterService);

  initializeIntervals(intervalsService, qcObjectService, bookkeepingService);

  return {
    userController,
    layoutController,
    statusService,
    statusController,
    objectController,
    intervalsService,
    filterController,
    layoutRepository,
    jsonFileService,
  };
};

/**
 * Method to register services at the start of the server
 * @param {Intervals} intervalsService - wrapper for storing intervals
 * @param {QcObjectService} qcObjectService - service for retrieving information on qc objects
 * @param {BookkeepingService} bkpService - service for retrieving information on runs from Bookkeeping
 * @returns {void}
 */
function initializeIntervals(intervalsService, qcObjectService, bkpService) {
  intervalsService.register(
    qcObjectService.refreshCache.bind(qcObjectService),
    qcObjectService.getCacheRefreshRate(),
  );

  intervalsService.register(
    bkpService.retrieveRunTypes.bind(bkpService),
    bkpService.refreshInterval,
  );
}
