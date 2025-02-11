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
'use strict';

import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_PUBLIC_CONF_LOCATION = './../../public/config.js';

/**
 * Removes (if exists) and creates a new config file which is to be sent to the client side for public configurations
 * The public-configuration file is based on `config.js` file
 * @param {JSON} config - server configuration
 * @returns {void}
 */
function buildPublicConfig(config) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const publicConfigPath = join(__dirname, DEFAULT_PUBLIC_CONF_LOCATION);

  if (existsSync(publicConfigPath)) {
    rmSync(publicConfigPath);
  }

  const publicConfig = {
    REFRESH_MIN_INTERVAL: config?.consul?.refreshRate?.min || 10,
    REFRESH_MAX_INTERVAL: config?.consul?.refreshRate?.max || 120,
    CONSUL_SERVICE: config.consul ? true : false,
  };

  const codeStr = `const publicConfig = ${JSON.stringify(publicConfig, null, 2)};\nexport { publicConfig as QCG };\n`;

  writeFileSync(publicConfigPath, codeStr);
}

export { buildPublicConfig };
