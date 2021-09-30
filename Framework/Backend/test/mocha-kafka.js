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

const KafkaConnector = require('./../services/kafka.js');
const config = require('./../config-default.json');
const assert = require('assert');

describe('Kafka Connector test suite', () => {
  describe('Check Initialization of KafkaConnector', () => {
    it('should not throw error if entire kafka configuration is missing', () => {
      assert.doesNotThrow(() => {
        new KafkaConnector();
      });
    });

    it('should throw error due to missing all mandatory fields in config', () => {
      assert.throws(() => {
        new KafkaConnector({});
      }, new Error('Kafka broker list was not provided'));
    });

    it('should successfully create a kafka connector', () => {
      const kafka = new KafkaConnector(config.kafka);
      assert(kafka.kafka !== undefined);
      assert.deepStrictEqual(kafka.isConfigured(), true);
    });
    it('should return false for kafka not being properly configured', () => {
      const kafka = new KafkaConnector();
      assert.deepStrictEqual(kafka.isConfigured(), false);
    });
  });

  /// Remove .skip to actually run tests
  describe.skip('Check integration with Kafka', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const WebSocket = require('./../websocket/server');
    const HttpServer = require('./../http/server');
    const JwtToken = require('./../jwt/token.js');
    const wsClient = require('ws');
    let wsServer, http, kafka;

    it('should report health status', async () => {
      const kafka = new KafkaConnector(config.kafka);
      await kafka.health();
    });

    it('should send and receive a notification', async () => {
      const jwt = new JwtToken(config.jwt);
      kafka = new KafkaConnector(config.kafka);
      http = new HttpServer(config.http, config.jwt);
      wsServer = new WebSocket(http);
      const token = jwt.generateToken(0, 'test', 1);
      const client = new wsClient('ws://localhost:' + config.http.port + '/?token=' + token);
      client.on('message', (message) => {
        const parsed = JSON.parse(message);
        if (parsed.command == 'authed') {
          return;
        }
        assert.strictEqual(parsed.command, 'notification');
        assert.strictEqual(parsed.payload, 'test notification');
        client.terminate();
      });

      await kafka.proxyWebNotificationToWs(wsServer);
      await kafka.triggerWebNotification('test notification');
    });

    after(() => {
      wsServer.shutdown();
      http.close();
      kafka.disconnectProxy();
    });
  });
});
