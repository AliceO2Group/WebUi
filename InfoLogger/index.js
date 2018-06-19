const path = require('path');
const {HttpServer, WebSocket} = require('@aliceo2/web-ui');

const config = require('./lib/configProvider.js');
const api = require('./lib/api.js');

// -------------------------------------------------------

const http = new HttpServer(config.http);
const ws = new WebSocket(http);
http.addStaticPath(path.join(__dirname, 'public'));
api.attachTo(http, ws);
