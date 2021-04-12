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

const {Log, HttpServer} = require('@aliceo2/web-ui');
const log = new Log('QualityControl/Index');
const path = require('path');
const api = require('./lib/api.js');

// Reading config file
const config = require('./lib/configProvider.js');

// Quick check config at start

if (config.http.tls) {
  log.info(`HTTPS endpoint: https://${config.http.hostname}:${config.http.portSecure}`);
}
log.info(`HTTP endpoint: http://${config.http.hostname}:${config.http.port}`);
if (typeof config.demoData != 'undefined' && config.demoData) {
  log.info(`Using demo data`);
} else {
  config.demoData = false;
}

//TODO Generate config

// Start servers
const http = new HttpServer(config.http, config.jwt, config.openId);
http.addStaticPath(path.join(__dirname, 'public'));
http.addStaticPath(path.join(require.resolve('jsroot'), '../..'), 'jsroot');
http.addStaticPath(path.join(__dirname, 'zstd'));

api.setup(http);
