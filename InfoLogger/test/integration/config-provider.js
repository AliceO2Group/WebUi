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

const url = (testConfig && testConfig.hostname && testConfig.port) ? `http://${testConfig.hostname}:${testConfig.port}/` : 'http://localhost:8080/';
const timeout = (testConfig && testConfig.timeout) ? testConfig.timeout : 200000;
const facility = (testConfig && testConfig.facility) ? testConfig.facility : 'readout';
const timestamp = (testConfig && testConfig.timestamp) ? testConfig.timestamp : '-2h';
const queryTime = (testConfig && testConfig.queryTime) ? testConfig.queryTime : 4000;

module.exports = {url, timeout, facility, timestamp, queryTime};
