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

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { LogManager, HttpServer, WebSocket } from '@aliceo2/web-ui';
import { setup } from './lib/api.js';
import { config } from './lib/config/configProvider.js';
import { SequelizeDatabase } from './lib/database/index.js';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/index`);
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Reading config file
// Quick check config at start
if (config.http.tls) {
  logger.info(`HTTPS endpoint: https://${config.http.hostname}:${config.http.portSecure}`);
}
logger.info(`HTTP endpoint: http://${config.http.hostname}:${config.http.port}`);
if (typeof config.demoData !== 'undefined' && config.demoData) {
  logger.info('Using demo data');
} else {
  config.demoData = false;
}

// Connect to the database
const database = new SequelizeDatabase();
try {
  await database.connect();
  await database.migrate();
} catch (error) {
  logger.errorMessage(`Error while starting database: ${error}`);
}

// Start servers
const http = new HttpServer(config.http, config.jwt, config.openId);
http.addStaticPath(join(__dirname, 'common'));
http.addStaticPath(join(__dirname, 'public'));

const pathName = require.resolve('jsroot');
http.addStaticPath(join(pathName, '../..'), 'jsroot');

const ws = new WebSocket(http);

if (process.env.NODE_ENV === 'test') {
  // Initialize nock for CCDB if we are in test environment
  const { initializeNockForCcdb } = await import('./test/setup/testSetupForCcdb.js');
  initializeNockForCcdb();
}

setup(http, ws);
