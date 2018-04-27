// Import the backend classes
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');

// Define configuration for JWT tokens and HTTP server
const config = require('./config.js');


// HTTP server
// -----------
//
// Instanciate the HTTP server
const httpServer = new HttpServer(config.http, config.jwt);

// Server static content in public directory
httpServer.addStaticPath('./public');

// Declare HTTP POST route availabe under "/api/getDate" path
httpServer.post('/getDate', (req, res) => {
  res.json({date: new Date()});
});


// WebSocket server
// ----------------
//
// Instanciate the WebSocket server
const wsServer = new WebSocket(httpServer);

// Define gloval variable
let streamTimer = null;

// Declare WebSocket callback for 'stream-date' messages
wsServer.bind('stream-date', (message) => {
  if (streamTimer) {
    // already started, kill it
    clearInterval(streamTimer);
    streamTimer = null;
    return;
  }

  // Use internal logging
  Log.info('start timer');

  // Broadcase the time to all clients every 100ms
  streamTimer = setInterval(() => {
    wsServer.broadcast(
      new WebSocketMessage(200).setCommand('server-date').setPayload({date: new Date()})
    );
  }, 100);
  return new WebSocketMessage(200).setCommand('stream-date');
});
