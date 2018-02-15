// Import the backend classes
const HttpServer = require('../../Backend/http/server.js');
const Log = require('../../Backend/log/log.js');
const WebSocket = require('../../Backend/websocket/server.js');
const WebSocketMessage = require('../../Backend/websocket/message.js');
const path = require('path');

const config = {
  jwt: {
    secret: 'supersecret',
    expiration: '10m'
  },
  http: {
    port: 8080,
    hostname: 'localhost',
    tls: false
  }
};

// Instanciate the HTTP and WebSocket servers
const http = new HttpServer(config.http, config.jwt);

// Server static content in public directory
http.addStaticPath(path.join(__dirname, '../')); // expose tutorials
http.addStaticPath(path.join(__dirname)); // expose index.html

Log.info('Open you browser on http://127.0.0.1:8080');
