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
const { WebSocket: WsClient } = require('ws');
const assert = require('assert');
const WebSocket = require('./../websocket/server');
const HttpServer = require('./../http/server');
const O2TokenService = require('./../services/O2TokenService.js');
const sinon = require('sinon');
const WebSocketMessage = require('./../websocket/message.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let http, wss, tokenService, token; // eslint-disable-line

const filters = {
  timestamp: {
    since: '13:02:30',
    until: '13:02:40',
    $since: '2024-12-02T12:02:30.000Z',
    $until: '2024-12-02T12:02:40.000Z',
  },
  hostname: {
    match: 'aldaqecs01-v1',
    exclude: '',
    $match: 'aldaqecs01-v1',
    $exclude: null,
  },
  rolename: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  pid: {
    match: '50990',
    exclude: '',
    $match: '50990',
    $exclude: null,
  },
  username: {
    match: 'alicedaq',
    exclude: '',
    $match: 'alicedaq',
    $exclude: null,
  },
  system: {
    match: 'DAQ',
    exclude: '',
    $match: 'DAQ',
    $exclude: null,
  },
  facility: {
    match: 'runControl',
    exclude: '',
    $match: 'runControl',
    $exclude: null,
  },
  detector: {
    match: 'TPC',
    exclude: '',
    $match: 'TPC',
    $exclude: null,
  },
  partition: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  run: {
    match: '248023',
    exclude: '',
    $match: '248023',
    $exclude: null,
  },
  errcode: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  errline: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  errsource: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  message: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  severity: {
    in: 'I F',
    $in: [
      'I',
      'F',
    ],
  },
  level: {
    max: null,
    $max: null,
  },
};

const minifiedFilters = '{"timestamp":{"since":"13:02:30","until":"13:02:40"},"hostname":{"match":"aldaqecs01-v1"},' +
'"pid":{"match":"50990"},"username":{"match":"alicedaq"},"system":{"match":"DAQ"},"facility":{"match":"runControl"},' +
'"detector":{"match":"TPC"},"run":{"match":"248023"},"severity":{"in":"I F"}}';

describe('websocket', () => {
  before(() => {
    tokenService = new O2TokenService(config.jwt);
    token = tokenService.generateToken(0, 'test', 'Test', 'admin');

    http = new HttpServer(config.http, config.jwt);
    wss = new WebSocket(http, config.jwt, 'localhost');

    wss.bind('test', (message) => {
      const res = new WebSocketMessage().setCommand(message.getCommand());
      return res;
    });

    wss.bind('fail', () => ({ test: 'test' }));

    wss.bind('broadcast', (message) => {
      const res = new WebSocketMessage().setCommand(message.getCommand()).setBroadcast();
      return res;
    });
  });

  it('Drop connection due to invalid JWT token', (done) => {
    const connection = new WsClient(`ws://localhost:${config.http.port}`);
    connection.on('close', () => {
      connection.terminate();
      done();
    });
  });

  it('Connect send, and receive a message', (done) => {
    const connection = new WsClient(`ws://localhost:${config.http.port}/?token=${token}`);

    connection.on('open', () => {
      const message = { command: 'test', token: token };
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
    const connection = new WsClient(`ws://localhost:${config.http.port}/?token=${token}`);

    connection.on('open', () => {
      const message = { command: '', token: token };
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
    const connection = new WsClient(`ws://localhost:${config.http.port}/?token=${token}`);

    connection.on('open', () => {
      const message = { command: 'fail', token: token };
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
    const connection = new WsClient(`ws://localhost:${config.http.port}/?token=${token}`);

    connection.on('open', () => {
      const message = { command: 'filter',
        token: token,
        filter: function () {
          return false;
        }.toString() };
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

  it('Live filter changes are logged', (done) => {
    const wsClient = new WsClient(`ws://localhost:${config.http.port}/?token=${token}`);
    wss.logger = {
      debugMessage: sinon.spy(),
    };

    // eslint-disable-next-line jsdoc/require-jsdoc
    function filterFunction(message, returnCriteriasOnly = false) {
      if (returnCriteriasOnly) {
        return 'PLACE_HOLDER';
      }
      return 'Dont check me pls';
    };
    let filterFunctionAsString = filterFunction.toString();
    filterFunctionAsString = filterFunctionAsString.replace('\'PLACE_HOLDER\'', JSON.stringify(filters));

    const theMessage = {
      command: 'filter',
      token: 'token',
      payload: filterFunctionAsString,
    };
    wsClient.on('open', () => {
      wsClient.send(JSON.stringify(theMessage));
      wsClient.ping();
    }).on('pong', () => {
      assert.ok(wss.logger.debugMessage.calledWith(`New live filter applied: ${minifiedFilters}`));
      done();
    });
  });

  it('minifyCriteria() works as expected', (done) => {
    const criterias = wss.minifyCriteria(filters);
    assert.strictEqual(JSON.stringify(criterias), minifiedFilters);
    done();
  });

  it('Request message broadcast with 200', (done) => {
    const connection = new WsClient(`ws://localhost:${config.http.port}/?token=${token}`);

    connection.on('open', () => {
      const message = { command: 'broadcast', token: token };
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
    wss.shutdown();
    http.close();
  });
});
