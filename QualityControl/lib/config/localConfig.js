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
 * Remove if exists and create a config file which is to be sent to the client side for fixed configurations
 * @param {JSON} config 
 */
function setLocalConfig(config) {
  const publicConfigPath = path.join(__dirname, './../../public/config/public.js');
  const localConfigExist = fs.existsSync(publicConfigPath);
  if (localConfigExist) {
    fs.rmSync(publicConfigPath);
  }
  const publicConfig = {
    CCDB_PLOT_URL: config.ccdb.plotUrl,
  };
  let codeStr = `const publicConfig = ${JSON.stringify(publicConfig, null, 4)}; \nexport {publicConfig as QCG};\n`;
  fs.writeFileSync(publicConfigPath, codeStr);

}

module.exports = {setLocalConfig};
