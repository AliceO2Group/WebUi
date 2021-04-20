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

const fs = require('fs');
const path = require('path');

/**
 * Removes (if exists) and creates a new config file which is to be sent to the client side for fixed configurations
 * The configuration file is based on `config.js` file
 * @param {JSON} config 
 */
function buildPublicConfig(config) {
  const publicConfigPath = path.join(__dirname, './../../public/config.js');
  const publicConfigExist = fs.existsSync(publicConfigPath);
  if (publicConfigExist) {
    fs.rmSync(publicConfigPath);
  }
  const publicConfig = {
    CCDB_PLOT_URL: config?.ccdb?.plotUrl || 'localhost:8080/ccdb',
    REFRESH_MIN_INTERVAL: config?.consul?.refreshRate?.min || 10,
    REFRESH_MAX_INTERVAL: config?.consul?.refreshRate?.max || 120,
  };
  let codeStr = `/* eslint-disable quote-props */\n`
    + `const publicConfig = ${JSON.stringify(publicConfig, null, 2)}; \nexport {publicConfig as QCG};\n`;
  fs.writeFileSync(publicConfigPath, codeStr);
}

module.exports = {buildPublicConfig};
