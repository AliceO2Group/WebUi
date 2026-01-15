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

import { LogManager } from '@aliceo2/web-ui';
import { openFile, toJSON } from 'jsroot';
import { Kafka, logLevel } from 'kafkajs';

import { CcdbService } from './services/ccdb/CcdbService.js';
import { IntervalsService } from './services/Intervals.service.js';
import { StatusService } from './services/Status.service.js';
import { JsonFileService } from './services/JsonFileService.js';
import { QcObjectService } from './services/QcObject.service.js';
import { FilterService } from './services/FilterService.js';
import { BookkeepingService } from './services/BookkeepingService.js';
import { AliEcsSynchronizer } from './services/external/AliEcsSynchronizer.js';

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
import { objectGetByIdValidationMiddlewareFactory }
  from './middleware/objects/objectGetByIdValidationMiddlewareFactory.js';
import { objectsGetValidationMiddlewareFactory } from './middleware/objects/objectsGetValidationMiddlewareFactory.js';
import { objectGetContentsValidationMiddlewareFactory }
  from './middleware/objects/objectGetContentsValidationMiddlewareFactory.js';
import { RunModeService } from './services/RunModeService.js';
import { KafkaConfigDto } from './dtos/KafkaConfigurationDto.js';
import { QcdbDownloadService } from './services/QcdbDownload.service.js';
const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/model-setup`;

/**
 * Model initialization for the QCG application
 * @param {EventEmitter} eventEmitter - Event emitter instance for inter-service communication
 * @returns {Promise<object>} Multiple services and controllers that are to be used by the QCG application
 */
export const setupQcModel = async (eventEmitter) => {
  const logger = LogManager.getLogger(LOG_FACILITY);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJSON = JSON.parse(readFileSync(`${__dirname}/../package.json`));

  const jsonFileService = new JsonFileService(config.dbFile || `${__dirname}/../db.json`);

  const databaseConfig = config.database || {};
  if (Object.keys(databaseConfig).length > 0) {
    try {
      const sequelizeDatabase = new SequelizeDatabase(databaseConfig);
      await initDatabase(sequelizeDatabase, { forceSeed: config?.database?.forceSeed, drop: config?.database?.drop });
      logger.infoMessage('Database initialized successfully');
    } catch (error) {
      logger.errorMessage(`Database initialization failed: ${error.message}`);
    }
  } else {
    logger.warnMessage('No database configuration found, skipping database initialization');
  }

  if (config?.kafka?.enabled) {
    try {
      const validConfig = await KafkaConfigDto.validateAsync(config.kafka);
      const { clientId, brokers, consumerGroups } = validConfig;
      const kafkaClient = new Kafka({
        clientId,
        brokers,
        retry: { retries: Infinity },
        logLevel: logLevel.NOTHING,
      });
      const aliEcsSynchronizer = new AliEcsSynchronizer(kafkaClient, consumerGroups, eventEmitter);
      aliEcsSynchronizer.start();
    } catch (error) {
      logger.errorMessage(`Kafka initialization/connection failed: ${error.message}`);
    }
  }

  const layoutRepository = new LayoutRepository(jsonFileService);
  const userRepository = new UserRepository(jsonFileService);
  const chartRepository = new ChartRepository(jsonFileService);

  const userController = new UserController(userRepository);
  const layoutController = new LayoutController(layoutRepository);

  const statusService = new StatusService({ version: packageJSON?.version ?? '-' }, { qc: config.qc ?? {} });
  const statusController = new StatusController(statusService);

  const qcdbDownloadService = new QcdbDownloadService(config.ccdb);

  const ccdbService = CcdbService.setup(config.ccdb);
  statusService.dataService = ccdbService;

  const qcObjectService = new QcObjectService(ccdbService, chartRepository, { openFile, toJSON });
  qcObjectService.refreshCache();

  const intervalsService = new IntervalsService();

  const bookkeepingService = new BookkeepingService(config.bookkeeping);
  await bookkeepingService.connect();
  const filterService = new FilterService(bookkeepingService, config);
  const runModeService = new RunModeService(config.bookkeeping, bookkeepingService, ccdbService, eventEmitter);
  const objectController = new ObjectController(qcObjectService, runModeService, qcdbDownloadService);

  const filterController = new FilterController(filterService, runModeService);

  const objectGetByIdValidation = objectGetByIdValidationMiddlewareFactory(filterService);
  const objectsGetValidation = objectsGetValidationMiddlewareFactory(filterService);
  const objectGetContentsValidation = objectGetContentsValidationMiddlewareFactory(filterService);

  initializeIntervals(intervalsService, qcObjectService, filterService, runModeService);

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
    objectGetByIdValidation,
    objectsGetValidation,
    objectGetContentsValidation,
  };
};

/**
 * Method to register services at the start of the server
 * @param {Intervals} intervalsService - wrapper for storing intervals
 * @param {QcObjectService} qcObjectService - service for retrieving information on qc objects
 * @param {FilterService} filterService - service for retrieving run types information from Bookkeeping
 * @param {RunModeService} runModeService - service for monitoring the status of runs
 * @returns {void}
 */
function initializeIntervals(intervalsService, qcObjectService, filterService, runModeService) {
  intervalsService.register(
    qcObjectService.refreshCache.bind(qcObjectService),
    qcObjectService.getCacheRefreshRate(),
  );

  if (filterService.runTypesRefreshInterval > 0) {
    intervalsService.register(
      filterService.getRunTypes.bind(filterService),
      filterService.runTypesRefreshInterval,
    );
  }

  if (runModeService.refreshInterval > 0) {
    intervalsService.register(
      runModeService.refreshRunsCache.bind(runModeService),
      runModeService.refreshInterval,
    );
  }
}
