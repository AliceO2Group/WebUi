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

const { LogManager } = require('@aliceo2/web-ui');

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/config`);
const fs = require('fs');
const path = require('path');

/**
 * Config provider is a module exporting the configuration file.
 * It can be first argument of command line OR by default config.js
 */

// Default configuration file
let configFile = path.join(__dirname, '../config.js');

// Replace if provided by command line
if (process.argv.length >= 3 && /\.js$/.test(process.argv[2])) {
  [,, configFile] = process.argv;
}

try {
  configFile = fs.realpathSync(configFile);
} catch (err) {
  logger.errorMessage(`Unable to read config file: ${err.message}`);
  process.exit(1);
}

const config = require(configFile);

LogManager.configure(config);
logger.infoMessage(`Loaded configuration file: "${configFile}"`);

if (!config.mysql) {
  logger.warnMessage('MySQL configuration not found. Database querying is not be available');
}

if (!config.infoLoggerServer) {
  logger.warnMessage('InfoLogger server configuration not found. Live monitoring is not available');
}

module.exports = config;
