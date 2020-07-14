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

module.exports = {url, timeout, facility, timestamp};
