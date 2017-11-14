const config = require('./../config.json');
const WebSocketClient = require('ws');
const WebSocket = require('./../websocket/server');
const HttpServer = require('./../http/server');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let http;

describe('websocket', () => {
  before(() => {
    http = new HttpServer(config.http, config.jwt, config.oAuth);
  });
  it('connection should be dropped due to invalid oAuth token', (done) => {
    const ws = new WebSocket(http, config.jwt, 'localhost');
    const connection = new WebSocketClient(
      'ws://127.0.0.1:' + config.http.port
    );
    connection.on('close', () => {
      ws.shutdown();
      done();
    });
  });
  after(() => {
    http.getServer.close();
  });
});
