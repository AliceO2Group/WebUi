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

import { HttpServer, WebSocket } from '@aliceo2/web-ui';
import { join, dirname } from 'path';
import { setup } from './lib/api.js';
import { fileURLToPath } from 'url';
import { config } from './lib/config/configProvider.js';
import { createRequire } from 'module';
import environmentSetup from './environmentSetup.js';

const logger = await environmentSetup();
// Reading config file
if (config.http.tls) {
  logger.infoMessage(`HTTPS endpoint: https://${config.http.hostname}:${config.http.portSecure}`);
}
logger.infoMessage(`HTTP endpoint: http://${config.http.hostname}:${config.http.port}`);
if (typeof config.demoData != 'undefined' && config.demoData) {
  logger.infoMessage('Using demo data');
} else {
  config.demoData = false;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pathName = require.resolve('jsroot');

// Start servers
const http = new HttpServer(config.http, config.jwt, config.openId);
http.addStaticPath(join(__dirname, 'common'));
http.addStaticPath(join(__dirname, 'public'));
http.addStaticPath(join(pathName, '../..'), 'jsroot');

const ws = new WebSocket(http);

setup(http, ws);
