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
import { LogManager, ConsulService } from '@aliceo2/web-ui';

import { CcdbService } from './services/ccdb/CcdbService.js';
import { IntervalsService } from './services/Intervals.service.js';
import { StatusService } from './services/Status.service.js';
import { JsonFileService } from './services/JsonFileService.js';
import { QcObjectService } from './services/QcObject.service.js';
import { UserService } from './services/UserService.js';

import { LayoutController } from './controllers/LayoutController.js';
import { StatusController } from './controllers/StatusController.js';
import { ObjectController } from './controllers/ObjectController.js';

import { config } from './config/configProvider.js';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/model`);

/*
 * --------------------------------------------------------
 * Initialization of model according to config file
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJSON = JSON.parse(readFileSync(`${__dirname}/../package.json`));

const jsonDb = new JsonFileService(config.dbFile || `${__dirname}/../db.json`);
export const userService = new UserService(jsonDb);
export const layoutService = new LayoutController(jsonDb);

export const statusService = new StatusService({ version: packageJSON?.version ?? '-' }, { qc: config.qc ?? {} });
export const statusController = new StatusController(statusService);

export let consulService = undefined;
if (config.consul) {
  consulService = new ConsulService(config.consul);
  consulService.getConsulLeaderStatus()
    .then(() => logger.info('Consul Service connection was successfully tested.'))
    .catch((error) => logger.error('Consul Service connection could not be established. '
      + `Please try restarting the service due to: ${error}`));
  statusController.setLiveModeConnector(consulService);
} else {
  logger.warn('Consul Service: No Configuration Found');
}

const ccdbService = CcdbService.setup(config.ccdb);
statusService.dataService = ccdbService;
statusService.onlineService = consulService;

const qcObjectService = new QcObjectService(ccdbService, jsonDb, { openFile, toJSON });
qcObjectService.refreshCache();

export const objectController = new ObjectController(qcObjectService, consulService);
export const intervalsService = new IntervalsService();

intervalsService.register(
  qcObjectService.refreshCache.bind(qcObjectService),
  qcObjectService.getCacheRefreshRate(),
);
