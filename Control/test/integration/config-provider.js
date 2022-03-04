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

/* eslint-disable no-console */
/* eslint-disable max-len */

let testConfig;
try {
  testConfig = require('./test-config');
} catch (error) {
  console.warn('`test-config.js` file could not be found. Will use default values.');
}

const workflow = (testConfig && testConfig.workflow) ? testConfig.workflow : 'readout-dataflow';
const timeout = (testConfig && testConfig.timeout) ? testConfig.timeout : 200000;
const requestTimeout = (testConfig && testConfig.requestTimeout) ? testConfig.requestTimeout : 90;
const url = (testConfig && testConfig.hostname && testConfig.port) ? `http://${testConfig.hostname}:${testConfig.port}/` : 'http://localhost:8080/';
const vars = (testConfig && testConfig.vars) ? testConfig.vars : {};

module.exports = {url, workflow, timeout, requestTimeout, vars};
