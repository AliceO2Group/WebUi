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

const config = require('./../config-default.json');
const WebSocketClient = require('ws');
const assert = require('assert');
const WebSocket = require('./../websocket/server');
const HttpServer = require('./../http/server');
const O2WebToken = require('./../http/O2WebToken.js');
const WebSocketMessage = require('./../websocket/message.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


let http, ws, o2WebToken, token; // eslint-disable-line

describe('websocket', () => {
  before(() => {
    o2WebToken = new O2WebToken(config.jwt);
    token = o2WebToken.generateToken(0, 'test', 'Test', 'admin');

    http = new HttpServer(config.http, config.jwt);
    ws = new WebSocket(http, config.jwt, 'localhost');
    ws.bind('test', (message) => {
      const res = new WebSocketMessage().setCommand(message.getCommand());
      return res;
    });

    ws.bind('fail', () => {
      return {test: 'test'};
    });

    ws.bind('broadcast', (message) => {
      const res = new WebSocketMessage().setCommand(message.getCommand()).setBroadcast();
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

  it('Connect send, and receive a message', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: 'test', token: token};
      connection.send(JSON.stringify(message));
    });
    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.command == 'authed') {
        return;
      }
      assert.strictEqual(parsed.command, 'test');
      connection.terminate();
      done();
    });
  });

  it('Reject message with misformatted fields', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: '', token: token};
      connection.send(JSON.stringify(message));
    });
    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.command == 'authed') {
        return;
      }
      assert.strictEqual(parsed.code, 400);
      connection.terminate();
      done();
    });
  });

  it('Reject message with 500', (done) => {
    const connection = new WebSocketClient(
      'ws://localhost:' + config.http.port + '/?token=' + token
    );

    connection.on('open', () => {
      const message = {command: 'fail', token: token};
      connection.send(JSON.stringify(message));
    });
    connection.on('message', (message) => {
      const parsed = JSON.parse(message);
      if (parsed.command == 'authed') {
        return;
      }
      assert.strictEqual(parsed.code, 500);
      connection.terminate();
      done();
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
      if (parsed.command == 'authed') {
        return;
      }
      assert.strictEqual(parsed.code, 200);
      assert.strictEqual(parsed.command, 'filter');
      connection.terminate();
      done();
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
      if (parsed.command == 'authed') {
        return;
      }
      assert.strictEqual(parsed.code, 200);
      assert.strictEqual(parsed.command, 'broadcast');
      connection.terminate();
      done();
    });
  });

  after(() => {
    ws.shutdown();
    http.close();
  });
});
