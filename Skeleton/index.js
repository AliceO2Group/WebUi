// Import the backend framework
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/aliceo2-gui');

// Import config and utils
const config = require('./config.js');
const path = require('path');

// Instanciate the HTTP and WebSocket servers
const http = new HttpServer(config.http, config.jwt, config.oAuth);
const ws = new WebSocket(http);

// Declare a simple model to be modified
let serverCount = 0;

// Declare some HTTP API (under /api path)
http.post('/setCounter', (req, res) => {
  serverCount = req.query.count
  res.json({count: serverCount});
});

// Declare some WS API
ws.bind('hello', (body) => Log.info(JSON.stringify(body)));

setInterval(() => {
  ws.broadcast(new WebSocketMessage(200).setCommand('serverCountUpdate').setPayload({count: serverCount++}));
}, 500);

// Don't exit on errors
process.on('uncaughtException', function (err) {
  Log.error(err);
  console.trace(err); // local debug
});
