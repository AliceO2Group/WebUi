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

import { Log, HttpServer } from '@aliceo2/web-ui';
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/index`);
import path from 'path';
import { setup } from './lib/api.js';

// Reading config file
import { config } from './lib/config/configProvider.js';
import { buildPublicConfig } from './lib/config/publicConfigProvider.js';

// Quick check config at start

if (config.http.tls) {
  log.info(`HTTPS endpoint: https://${config.http.hostname}:${config.http.portSecure}`);
}
log.info(`HTTP endpoint: http://${config.http.hostname}:${config.http.port}`);
if (typeof config.demoData != 'undefined' && config.demoData) {
  log.info('Using demo data');
} else {
  config.demoData = false;
}

buildPublicConfig(config);

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Start servers
const http = new HttpServer(config.http, config.jwt, config.openId);
http.addStaticPath(path.join(__dirname, 'public'));

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pathName = require.resolve('jsroot');
http.addStaticPath(path.join(pathName, '../..'), 'jsroot');

setup(http);
