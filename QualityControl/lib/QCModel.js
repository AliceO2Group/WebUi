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

// Core dependencies
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

// External dependencies
import { LogManager } from '@aliceo2/web-ui';
import { openFile, toJSON } from 'jsroot';
import { Kafka, logLevel } from 'kafkajs';

// Services
import { CcdbService } from './services/ccdb/CcdbService.js';
import { IntervalsService } from './services/Intervals.service.js';
import { StatusService } from './services/Status.service.js';
import { QcObjectService } from './services/QcObject.service.js';
import { FilterService } from './services/FilterService.js';
import { LayoutService } from './services/layout/LayoutService.js';
import { UserService } from './services/layout/UserService.js';
import { RunModeService } from './services/RunModeService.js';
import { AliEcsSynchronizer } from './services/external/AliEcsSynchronizer.js';
import { BookkeepingService } from './services/external/BookkeepingService.js';

//Controllers
import { LayoutController } from './controllers/LayoutController.js';
import { StatusController } from './controllers/StatusController.js';
import { ObjectController } from './controllers/ObjectController.js';
import { FilterController } from './controllers/FilterController.js';
import { UserController } from './controllers/UserController.js';

//Database
import { config } from './config/configProvider.js';
import { initDatabase } from './database/index.js';
import { SequelizeDatabase } from './database/SequelizeDatabase.js';
import { setupRepositories } from './database/repositories/index.js';

//Middleware factories
import { objectGetByIdValidationMiddlewareFactory }
  from './middleware/objects/objectGetByIdValidationMiddlewareFactory.js';
import { objectsGetValidationMiddlewareFactory } from './middleware/objects/objectsGetValidationMiddlewareFactory.js';
import { objectGetContentsValidationMiddlewareFactory }
  from './middleware/objects/objectGetContentsValidationMiddlewareFactory.js';

//DTOs
import { KafkaConfigDto } from './dtos/KafkaConfigurationDto.js';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/model-setup`;

/**
 * Model initialization for the QCG application
 * @param {EventEmitter} eventEmitter - Event emitter instance for inter-service communication
 * @returns {Promise<object>} Multiple services and controllers that are to be used by the QCG application
 */
export const setupQcModel = async (eventEmitter) => {
  const logger = LogManager.getLogger(LOG_FACILITY);

  // Load package metadata
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJSON = JSON.parse(readFileSync(`${__dirname}/../package.json`));

  // Kafka setup (optional)
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

  // Database setup
  const databaseConfig = config.database || {};
  if (!databaseConfig || Object.keys(databaseConfig).length === 0) {
    logger.errorMessage('Database configuration is not provided. The application cannot be initialized');
    return;
  }

  const sequelizeDatabase = new SequelizeDatabase(databaseConfig);
  initDatabase(sequelizeDatabase, { forceSeed: config?.database?.forceSeed, drop: config?.database?.drop });

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

  // Services
  const layoutService = new LayoutService(
    layoutRepository,
    userRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionRepository,
    optionRepository,
  );
  const userService = new UserService(userRepository);
  const statusService = new StatusService({ version: packageJSON?.version ?? '-' }, { qc: config.qc ?? {} });

  const ccdbService = CcdbService.setup(config.ccdb);
  statusService.dataService = ccdbService;

  const qcObjectService = new QcObjectService(ccdbService, layoutService, { openFile, toJSON });
  qcObjectService.refreshCache();

  const intervalsService = new IntervalsService();
  const bookkeepingService = new BookkeepingService(config.bookkeeping);
  const filterService = new FilterService(bookkeepingService, config);
  const runModeService = new RunModeService(config.bookkeeping, bookkeepingService, ccdbService, eventEmitter);

  // Controllers
  const userController = new UserController(userService);
  const layoutController = new LayoutController(layoutService);
  const statusController = new StatusController(statusService);
  const objectController = new ObjectController(qcObjectService, runModeService);
  const filterController = new FilterController(filterService, runModeService);

  // Middleware
  const objectGetByIdValidation = objectGetByIdValidationMiddlewareFactory(filterService);
  const objectsGetValidation = objectsGetValidationMiddlewareFactory(filterService);
  const objectGetContentsValidation = objectGetContentsValidationMiddlewareFactory(filterService);

  // Interval tasks
  initializeIntervals(intervalsService, qcObjectService, filterService, runModeService);

  // Return API
  return {
    layoutController,
    userController,
    statusService,
    statusController,
    objectController,
    intervalsService,
    filterController,
    layoutService,
    userService,
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
