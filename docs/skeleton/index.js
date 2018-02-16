// Import the backend classes
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/aliceo2-gui');

// Define configuration for JWT tokens and HTTP server
const config = require('./config.js');

// Instanciate the HTTP and WebSocket servers
const http = new HttpServer(config.http, config.jwt);
const ws = new WebSocket(http);

// Server static content in public directory
http.addStaticPath('./public');

// Declare simple model (global variable)
let serverCount = 0;

// ----------------------------------------
// REST API
// ----------------------------------------

// Declare HTTP POST route availabe under "/api/getDate" path
http.post('/getDate', (req, res) => {
  res.json({date: new Date()});
});

// ----------------------------------------
// WebSocket API
// ----------------------------------------

let streamTimer = null;

// Declare WebSocket callback for "stream-date" messages
ws.bind('stream-date', (body) => {
  if (streamTimer) {
    return; // already started
  }

  Log.info('start timer');

  // Send to all clients the date every 100ms
  streamTimer = setInterval(() => {
    ws.broadcast(
      new WebSocketMessage(200).setCommand('serverDate').setPayload({date: new Date()})
    );
  }, 100);
});
