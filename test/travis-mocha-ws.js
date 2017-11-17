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
    http = new HttpServer(config.http, config.jwt, config.oAuth);
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

    jwt = new JwtToken(config.jwt);
    token = jwt.generateToken(0, 'test', 1);
  });

  it('connection should be successful', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
    );

    connection.on('open', () => {
      connection.terminate();
      done();
    });
  });

  it('message should be returned', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
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

  it('response should be rejected and server should return 500', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
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

  it('filter should be accepted - 200', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
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

  it('filter should not be accepted - 200', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
    );

    connection.on('open', () => {
      const message = {command: 'filter', token: token, filter: 'function() return false;}'};
      connection.send(JSON.stringify(message));
    });
    connection.on('close', () => {
      done();
    });
  });

  it('token should be refreshed', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
    );

    connection.on('open', () => {
      const message = {command: 'test', token: token};
      setTimeout(() => {
        connection.send(JSON.stringify(message));
      }, 1200);
    });

    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.code == 440) {
        done();
      }
    });
  });

  it('message should be bradcast', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port
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
