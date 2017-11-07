const config = require('./../config.json');
const WebSocketClient = require('ws');
const WebSocket = require('./../websocket/server');
const HttpServer = require('./../http/server');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
let http;
let ws;

describe('websocket', () => {
  before(() => {
    http = new HttpServer(config.http, config.jwt, config.oAuth);
    ws = new WebSocket(http, config.jwt, 'localhost');
  });
  it('connection should be dropped due to invalid oAuth token', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.portSecure
    );  

    connection.on('close', () => {
      done();
    }); 
  });
  after(() => {
    http.getServer.close();
  });
});
