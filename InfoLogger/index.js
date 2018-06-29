const path = require('path');
const {HttpServer, WebSocket} = require('@aliceo2/web-ui');

const config = require('./lib/configProvider.js');
const api = require('./lib/api.js');

// -------------------------------------------------------

// Start server HTTP and bind WebSocket to it
const http = new HttpServer(config.http);
const ws = new WebSocket(http);

// Expose application to /
http.addStaticPath(path.join(__dirname, 'public'));

// Attach services to web server
api.attachTo(http, ws);
