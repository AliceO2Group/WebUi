const config = require('./../config.json');
const WebSocketClient = require('ws');
const WebSocket = require('./../websocket/server');
const HttpServer = require('./../http/server');
const JwtToken = require('./../jwt/token.js');
const WebSocketMessage = require('./../websocket/message.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


let http, ws, jwt, token; // eslint-disable-line

describe('websocket', () => {
  before(() => {
    jwt = new JwtToken(config.jwt);
    token = jwt.generateToken(0, 'test', 1);

    http = new HttpServer(config.http, config.jwt);
    ws = new WebSocket(http, config.jwt, 'localhost');
    ws.bind('test', (message) => {
      let res = new WebSocketMessage().setCommand(message.getCommand());
      return res;
    });

    ws.bind('fail', () => {
      return {test: 'test'};
    });

    ws.bind('broadcast', (message) => {
      let res = new WebSocketMessage().setCommand(message.getCommand()).setBroadcast();
      return res;
    });
  });

  it('Drop connection due to invalid JWT token', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
    );
    connection.on('close', () => {
      connection.terminate();
      done();
    });
  });

  it('Connect and receive a message', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: 'test', token: token};
      connection.send(JSON.stringify(message));
    });
    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.command == 'test') {
        done();
      }
    });
  });

  it('Reject messege with 500', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: 'fail', token: token};
      connection.send(JSON.stringify(message));
    });
    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.code == 500) {
        done();
      }
    });
  });

  it('Accept filter with 200', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: 'filter', token: token,
        filter: (function() {
          return false;
        }).toString()};
      connection.send(JSON.stringify(message));
    });

    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.code == 200 && parsed.command == 'filter') {
        done();
      }
    });
  });

  it('Request message broadcast with 200', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: 'broadcast', token: token};
      connection.send(JSON.stringify(message));
    });
    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.code == 200 && parsed.command == 'broadcast') {
        done();
      }
    });
  });

  after(() => {
    ws.shutdown();
    http.getServer.close();
  });
});
