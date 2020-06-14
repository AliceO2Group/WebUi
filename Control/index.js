const path = require('path');
const {HttpServer, WebSocket} = require('@aliceo2/web-ui');

const config = require('./lib/configProvider.js');
const api = require('./lib/api.js');

// -------------------------------------------------------

const http = new HttpServer(config.http, config.jwt, config.openId);
const ws = new WebSocket(http);
http.addStaticPath(path.join(__dirname, 'public'));
api.setup(http, ws);
