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
    ILG_EPN_URL: _getInfoLoggerEpnUrl(config),
    QCG_URL: _getQcgURL(config),
    BKP_URL: _getBookkeepingURL(config),
    GRAFANA: _getGrafanaConfig(config),
    CONSUL: getConsulConfig(config),
    REFRESH_TASK: config?.utils?.refreshTask || 10000,
  };
  const codeStr = '/* eslint-disable quote-props */\n'
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
    conf.protocol = conf?.protocol || 'http';
    conf.flpHardwarePath = conf?.flpHardwarePath || 'o2/hardware/flps';
    conf.detHardwarePath = conf?.detHardwarePath || 'o2/hardware/detectors',
    conf.readoutCardPath = conf?.readoutCardPath || 'o2/components/readoutcard';
    conf.qcPath = conf?.qcPath || 'o2/components/qc';
    conf.readoutPath = conf?.readoutPath || 'o2/components/readout';
    conf.kVPrefix = conf?.kVPrefix || 'ui/alice-o2-cluster/kv';

    conf.ui = conf.ui || `${conf.hostname}:${conf.port}`;
    conf.kvStoreQC = `${conf.ui}/${conf.kVPrefix}/${conf.qcPath}/`;
    conf.kvStoreReadout = `${conf.ui}/${conf.kVPrefix}/${conf.readoutPath}/`;
    conf.qcPrefix = `${conf.hostname}:${conf.port}/${conf.qcPath}/`;
    conf.readoutPrefix = `${conf.hostname}:${conf.port}/${conf.readoutPath}/`;
    return conf;
  }
  return {};
}

/**
 * Create a JSON containing static grafana information
 * @param {JSON} config - server configuration
 * @returns {JSON}
 */
function _getGrafanaConfig(config) {
  if (config?.grafana?.url) {
    const hostPort = config.grafana.url;
    const ecsDashboard = 'd-solo/SoUQ_Oy7z/aliecs-general';
    const theme = '&theme=light';
    return {
      status: true,
      plots: {
        flpStats: `${hostPort}/${ecsDashboard}?panelId=16${theme}`,
        epnStats: `${hostPort}/${ecsDashboard}?panelId=22${theme}`,
        readoutPlot: `${hostPort}/${ecsDashboard}?panelId=20${theme}`,
      },
    };
  } else {
    return { status: false };
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
  return ilg?.url ? `${ilg.url}` : '';
}

/**
 * Retrieves the EPN InfoLogger URL and sends it
 * @param {JSON} config - server configuration
 */
function _getInfoLoggerEpnUrl(config) {
  const ilg = config?.infoLoggerEpnGui;
  return ilg?.url ? `${ilg.url}` : '';
}

/**
 * Builds the URL of the QCG GUI and returns it as a string
 * Returns empty string if no configuration is provided for QCG
 * @param {JSON} config - server configuration
 * @returns {string}
 */
function _getQcgURL(config) {
  const qcg = config?.qcGui;
  return qcg?.url ? `${qcg.url}` : '';
}

/**
 * Builds the URL of the Bookkeeping GUI and returns it as a string
 * Returns empty string if no configuration is provided for Bookkeeping
 * @param {JSON} config - server configuration
 * @returns {string}
 */
function _getBookkeepingURL(config = {}) {
  const { bookkeeping = {} } = config;
  return bookkeeping.url ? new URL(bookkeeping.url) : null;
}

module.exports = {
  buildPublicConfig, _getGrafanaConfig, _getInfoLoggerURL, _getQcgURL, _getBookkeepingURL, getConsulConfig,
};
