const path = require('path');
const {HttpServer, WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');
const Octl = require('./octl.js');

const config = require('./config.js');

const http = new HttpServer(config.http);
http.addStaticPath(path.join(__dirname, 'public'));

const websocketServer = new WebSocket(http);

// PADLOCK
const Padlock = require('./padlock.js');
const padlock = new Padlock();

websocketServer.bind('lock-release', (message) => padlock.release(message));
websocketServer.bind('lock-get', (message) => padlock.get(message));
websocketServer.bind('lock-check', (message) => padlock.check(message));
websocketServer.bind('execute', (request) => {
  if (padlock.isHoldingLock(request.id)) {
    return new WebSocketMessage(202).setCommand('execute');
  } else {
    return new WebSocketMessage(403).setCommand('execute');
  }
});

const octl = new Octl(config.grpc);
const envId = octl.createEnv();
octl.printEnv(envId);
octl.trackStatus();
