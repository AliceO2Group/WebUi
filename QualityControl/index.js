const {Log, HttpServer} = require('@aliceo2/web-ui');
const log = new Log('QualityControl');
const path = require('path');
const api = require('./lib/api.js');

// Reading config file
const config = require('./lib/configProvider.js');

// Quick check config at start

if (config.http.tls) {
  log.info(`HTTPS endpoint: https://${config.http.hostname}:${config.http.portSecure}`);
}
log.info(`HTTP endpoint: http://${config.http.hostname}:${config.http.port}`);
if (typeof config.demoData != 'undefined' && config.demoData) {
  log.info(`Using demo data`);
} else {
  config.demoData = false;
}
log.info(`TObject2JSON URL: ${config.tobject2json.host}`);

// Start servers
const http = new HttpServer(config.http, config.jwt, config.oAuth);
http.addStaticPath(path.join(__dirname, 'public'));
http.addStaticPath(path.join(require.resolve('jsroot'), '../..'), 'jsroot');
api.setup(http);
