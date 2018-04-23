const HttpServer = require('@aliceo2/web-ui').HttpServer;
const log = require('@aliceo2/web-ui').Log;
const fs = require('fs');
const path = require('path');
const api = require('./lib/api.js');

// Reading config file
let configFile = './config.js';
if (process.argv.length >= 3) {
  configFile = process.argv[2];
}

try {
  configFile = fs.realpathSync(configFile);
} catch (err) {
  log.error(`Unable to read config file: ${err.message}`);
  process.exit(1);
}

log.info(`Reading config file "${configFile}"`);
const config = require(configFile);

// Quick check config at start

if (config.http.tls) {
  log.info(`HTTPS endpoint: https://${config.http.hostname}:${config.http.portSecure}`);
}
log.info(`HTTP endpoint: http://${config.http.hostname}:${config.http.port}`);
if (typeof config.demoData != 'undefined' &&  config.demoData) {
  log.info(`Using demo data`);
} else {
  config.demoData = false;
}
log.info(`TObject2JSON URL: ${config.tobject2json.host}`);

// Start servers
const http = new HttpServer(config.http, config.jwt, config.oAuth);
http.addStaticPath(path.join(__dirname, 'public'));
http.addStaticPath(path.join(require.resolve('jsroot'), '../..'), 'jsroot');
api.setup(config, http);
