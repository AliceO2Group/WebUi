/**
 * @license
 * Copyright 2019-2022 CERN and copyright holders of ALICE O2.
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

import { Log } from '@aliceo2/web-ui';
import { realpath } from 'node:fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/config`);

const DEFAULT_CONF_LOCATION = './../../config.js';

let config = {};
let configFilePath = _getConfigurationFilePath();

try {
  configFilePath = await realpath(configFilePath);
  ({ config } = await import(configFilePath));

  log.info(`Configuration file successfully read from: "${configFilePath}"`);
} catch (err) {
  log.error(`Unable to read configuration file (${configFilePath}) due to: ${err.message}`);
  process.exit(1);
}

/**
 * Method to retrieve the path to the configuration file
 * This can be either:
 * * default location at the root of the project - `./../../config.js`
 * * location can be set as argument during command line execution
 * @returns {string} - path to the configuration file
 */
function _getConfigurationFilePath() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  if (process.argv.length >= 3 && /\.js$/.test(process.argv[2])) {
    return process.argv[2];
  } else {
    return join(__dirname, DEFAULT_CONF_LOCATION);
  }
}

export { config, DEFAULT_CONF_LOCATION };
