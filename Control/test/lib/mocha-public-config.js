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
const assert = require('assert');
const config = require('../test-config.js');

const {
  _getBookkeepingURL, _getQcgURL, buildPublicConfig, _getInfoLoggerURL, _getGrafanaConfig
} = require('../../lib/config/publicConfigProvider');

describe('Public Configuration Test Suite', () => {
  const CONF_LOCATION = '../../public/config.js';
  it('should successfully create JS module with public configuration as export', () => {
    assert.doesNotThrow(() => buildPublicConfig(config));
  });

  it('should successfully import COG public configuration', async () => {
    const confExists = fs.existsSync(path.join(__dirname, CONF_LOCATION));
    assert.ok(confExists, 'Public configuration file was not identified');
  });

  it('should successfully return empty string if configuration is missing for ILG', () => {
    assert.strictEqual(_getInfoLoggerURL({}), '');
    assert.strictEqual(_getInfoLoggerURL(undefined), '');
    assert.strictEqual(_getInfoLoggerURL({infoLoggerGui: {hostname: 'local'}}), '');
    assert.strictEqual(_getInfoLoggerURL({infoLoggerGui: {port: 8080}}), '');
  });

  it('should successfully return ILG URL as string if configuration is provided', () => {
    assert.strictEqual(_getInfoLoggerURL({infoLoggerGui: {hostname: 'local', port: 8080}}), 'local:8080');
  });

  it('should successfully return status false JSON if configuration is missing for Grafana', () => {
    assert.deepStrictEqual(_getGrafanaConfig({}), {status: false});
    assert.deepStrictEqual(_getGrafanaConfig(undefined), {status: false});
    assert.deepStrictEqual(_getGrafanaConfig({grafana: {host: 'local'}}), {status: false});
    assert.deepStrictEqual(_getGrafanaConfig({http: {port: 8080}, grafana: {host: 'local'}}), {status: false});
  });

  it('should successfully return status true and plot list JSON if configuration is provided for Grafana', () => {
    const expectedConf = {
      status: true,
      plots: [
        'http://local:2000/d-solo/TZsAxKIWk/readout?orgId=1&panelId=6&refresh=5s&theme=light',
        'http://local:2000/d-solo/TZsAxKIWk/readout?orgId=1&panelId=8&refresh=5s&theme=light',
        'http://local:2000/d-solo/TZsAxKIWk/readout?orgId=1&panelId=4&refresh=5s&theme=light',
        'http://local:2000/d-solo/HBa9akknk/dd?orgId=1&panelId=10&refresh=5s&theme=light'
      ]
    };
    assert.deepStrictEqual(_getGrafanaConfig({grafana: {url: 'http://local:2000'}}), expectedConf);
  });

  it('should successfully return empty string if configuration is missing for QCG', () => {
    assert.strictEqual(_getQcgURL({}), '');
    assert.strictEqual(_getQcgURL(undefined), '');
    assert.strictEqual(_getQcgURL({qcGui: {urlWrong: 'local'}}), '');
  });

  it('should successfully return QCG URL as string if configuration is provided', () => {
    assert.strictEqual(_getQcgURL({qcGui: {url: 'localhost:8080'}}), 'localhost:8080');
  });

  it('should successfully return empty string if configuration is missing for Bookkeeping', () => {
    assert.strictEqual(_getBookkeepingURL({}), '');
    assert.strictEqual(_getBookkeepingURL(undefined), '');
    assert.strictEqual(_getBookkeepingURL({bookkeepingGui: {urlWrong: 'local'}}), '');
  });

  it('should successfully return QCG URL as string if configuration is provided', () => {
    assert.strictEqual(_getBookkeepingURL({bookkeepingGui: {url: 'localhost:8080'}}), 'localhost:8080');
  });
});
