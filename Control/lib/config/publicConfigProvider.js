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
    CONSUL: getConsulConfig(config),
    REFRESH_TASK: config?.utils?.refreshTask || 5000,
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
function getConsulConfig(config) {
  if (config?.consul) {
    const conf = config.consul;

    conf.flpHardwarePath = conf?.flpHardwarePath ? conf.flpHardwarePath : 'o2/hardware/flps';
    conf.readoutCardPath = conf?.readoutCardPath ? conf.readoutCardPath : 'o2/components/readoutcard';
    conf.qcPath = conf?.qcPath ? conf.qcPath : 'o2/components/qc';
    conf.readoutPath = conf?.readoutPath ? conf.readoutPath : 'o2/components/readout';
    conf.kVPrefix = conf?.kVPrefix ? conf.kVPrefix : 'ui/alice-o2-cluster/kv';

    conf.kvStoreQC = `${conf.hostname}:${conf.port}/${conf.kVPrefix}/${conf.qcPath}`;
    conf.kvStoreReadout = `${conf.hostname}:${conf.port}/${conf.kVPrefix}/${conf.readoutPath}`;
    conf.qcPrefix = `${conf.hostname}:${conf.port}/${conf.qcPath}/`;
    conf.readoutPrefix = `${conf.hostname}:${conf.port}/${conf.readoutPath}/`
    return conf;
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
    const plotReadoutRateNumber = 'd-solo/TZsAxKIWk/readout?orgId=1&panelId=6';
    const plotReadoutRate = 'd-solo/TZsAxKIWk/readout?orgId=1&panelId=8';
    const plotReadoutRateGraph = 'd-solo/TZsAxKIWk/readout?orgId=1&panelId=4';
    const plotDDGraph = 'd-solo/HBa9akknk/dd?orgId=1&panelId=10';
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

module.exports = {buildPublicConfig, _getGrafanaConfig, _getInfoLoggerURL, getConsulConfig};