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
    ILG_URL: _getInfoLoggerURL(config),
    GRAFANA: _getGrafanaConfig(config),
    CONSUL: _getConsulConfig(config),
  };
  let codeStr = `/* eslint-disable quote-props */\n`
    + `const publicConfig = ${JSON.stringify(publicConfig, null, 2)}; \nexport {publicConfig as COG};\n`;
  fs.writeFileSync(publicConfigPath, codeStr);
}

/**
 * Create a JSON containing static Consul information
 * @param {JSON} config - server configuration
 * @returns {JSON}
 */
function _getConsulConfig(config) {
  if (config?.consul) {
    return config.consul
  }
  return {};
}

/**
 * Create a JSON containing static grafana information
 * @param {JSON} config - server configuration
 * @return {JSON}
 */
function _getGrafanaConfig(config) {
  if (config?.grafana && config?.http?.hostname && config?.grafana?.port) {
    const hostPort = `http://${config.http.hostname}:${config.grafana.port}`;
    const plotReadoutRateNumber = 'd-solo/TZsAxKIWk/aliecs-gui?orgId=1&panelId=6';
    const plotReadoutRate = 'd-solo/TZsAxKIWk/aliecs-gui?orgId=1&panelId=8';
    const plotReadoutRateGraph = 'd-solo/TZsAxKIWk/aliecs-gui?orgId=1&panelId=4';
    const plotDDGraph = 'd-solo/HBa9akknk/aliecs-gui?orgId=1&panelId=10';
    const theme = '&refresh=5s&theme=light';
    return {
      status: true,
      plots: [
        `${hostPort}/${plotReadoutRateNumber}${theme}`,
        `${hostPort}/${plotReadoutRate}${theme}`,
        `${hostPort}/${plotReadoutRateGraph}${theme}`,
        `${hostPort}/${plotDDGraph}${theme}`,
      ]
    };
  } else {
    return {status: false};
  }
}

/**
 * Builds the URL of the InfoLogger GUI and returns it as a string
 * Returns empty string if no configuration is provided for ILG
 * @param {JSON} config - server configuration
 * @returns {string}
 */
function _getInfoLoggerURL(config) {
  const ilg = config?.infoLoggerGui;
  if (ilg && ilg.hostname && ilg.port) {
    return `${ilg.hostname}:${ilg.port}`;
  } else {
    return '';
  }
}

module.exports = {buildPublicConfig, _getGrafanaConfig, _getInfoLoggerURL};