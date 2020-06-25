/* eslint-disable no-console */
/* eslint-disable max-len */

let testConfig;
try {
  testConfig = require('./test-config');
} catch (error) {
  console.warn('`test-config.js` file could not be found. Will use default values.');
}

const timeout = (testConfig && testConfig.timeout) ? testConfig.timeout : 20000;
const url = (testConfig && testConfig.hostname && testConfig.port) ? `http://${testConfig.hostname}:${testConfig.port}/` : 'http://localhost:8082/';
const offlineObjects = (testConfig && testConfig.offlineObjects) ? testConfig.offlineObjects : ['qc/checks/TST/QcCheck', 'qc/DAQ/dataDistribution/payloadSize'];
const onlineObjects = (testConfig && testConfig.onlineObjects) ? testConfig.onlineObjects : ['qc/checks/TST/QcCheck', 'qc/DAQ/dataDistribution/payloadSize'];

module.exports = {timeout, url, offlineObjects, onlineObjects};
