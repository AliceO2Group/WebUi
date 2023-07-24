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

import { config } from './config/configProvider.js';
// Import projPackage from './../package.json';
import { openFile, toJSON } from 'jsroot';

import { ConsulService } from '@aliceo2/web-ui';
import { CcdbService } from './services/CcdbService.js';
import { QcObjectService } from './services/QcObject.service.js';
import { UserService } from './services/UserService.js';
import { JsonFileService } from './services/JsonFileService.js';
import { Intervals } from './services/Intervals.service.js';

import { LayoutController } from './controllers/LayoutController.js';
import { StatusController } from './controllers/StatusController.js';
import { ObjectController } from './controllers/ObjectController.js';

import { Log } from '@aliceo2/web-ui';
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/model`);

/*
 * --------------------------------------------------------
 * Initialization of model according to config file
 */
const projPackage = {}; // TODO
export const statusController = new StatusController(config, projPackage);

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonDb = new JsonFileService(config.dbFile || `${__dirname}/../db.json`);
export const userService = new UserService(jsonDb);
export const layoutService = new LayoutController(jsonDb);

export let consulService = undefined;
if (config.consul) {
  consulService = new ConsulService(config.consul);
  consulService.getConsulLeaderStatus()
    .then(() => log.info('Consul Service connection was successfully tested.'))
    .catch((error) => log.error('Consul Service connection could not be established. '
      + `Please try restarting the service due to: ${error}`));
  statusController.setLiveModeConnector(consulService);
} else {
  log.warn('Consul Service: No Configuration Found');
}

const ccdb = CcdbService.setup(config.ccdb);
statusController.setDataConnector(ccdb);

const qcObjectService = new QcObjectService(ccdb, jsonDb, { openFile, toJSON });
export const objectController = new ObjectController(qcObjectService, consulService);
export const intervalsService = new Intervals(qcObjectService);
