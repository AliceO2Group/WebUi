/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

// Import the backend classes
const {HttpServer, Log, WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');

// Define configuration for JWT tokens and HTTP server
const config = require('./config.js');

// Get logger instance
const log = new Log('Tutorial');

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
wsServer.bind('stream-date', () => {
  if (streamTimer) {
    // already started, kill it
    clearInterval(streamTimer);
    streamTimer = null;
    return;
  }

  // Use internal logging
  log.info('start timer');

  // Broadcase the time to all clients every 100ms
  streamTimer = setInterval(() => {
    wsServer.broadcast(
      new WebSocketMessage().setCommand('server-date').setPayload({date: new Date()})
    );
  }, 100);
  return new WebSocketMessage().setCommand('stream-date');
});
