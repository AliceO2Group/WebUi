// Import the backend classes
const HttpServer = require('../../Backend/http/server.js');
const Log = require('../../Backend/log/log.js');
const WebSocket = require('../../Backend/websocket/server.js');
const WebSocketMessage = require('../../Backend/websocket/message.js');
// When moving to a seperate project
// 1. Add framework to dependency list: npm install --save @aliceo2/aliceo2-gui
// 2. Replace lines 3-6 with following line:
// const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/aliceo2-gui');

// Define configuration for JWT tokens and HTTP server
// It could be moved to seperated file
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
const ws = new WebSocket(http);

// Server static content in public directory
http.addStaticPath('./public');

// Declare simple model (global variable)
let serverCount = 0;

// Declare HTTP POST route availabe under "/api/setCounter" path
http.post('/setCounter', (req, res) => {
  serverCount = req.query.count;
  res.json({count: serverCount});
});

// Declare WebSocket callback for "hello" messages
ws.bind('hello', (body) => Log.info(JSON.stringify(body)));

// Broadcast via WebSocket increamenting 'serverCount' variable
setInterval(() => {
  ws.broadcast(
    new WebSocketMessage(200).setCommand('serverCountUpdate').setPayload({count: serverCount++})
  );
}, 500);
