/* eslint-disable no-console */
/* eslint-disable max-len */

let testConfig;
try {
  testConfig = require('./test-config');
} catch (error) {
  console.warn('`test-config.js` file could not be found. Will use default values.');
}

const url = (testConfig && testConfig.hostname && testConfig.port) ? `http://${testConfig.hostname}:${testConfig.port}/` : 'http://localhost:8080/';
const workflow = (testConfig && testConfig.workflow) ? testConfig.workflow : 'readout-stfb';
const timeout = (testConfig && testConfig.timeout) ? testConfig.timeout : 200000;
const requestTimeout = (testConfig && testConfig.requestTimeout) ? testConfig.requestTimeout : 90;

module.exports = {url, workflow, timeout, requestTimeout};
