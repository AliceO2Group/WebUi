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

const NotificationService = require('./../services/notification.js');
const config = require('./../config-default.json');
const assert = require('assert');

describe('Kafka Connector test suite', () => {
  describe('Check Initialization of NotificationService', () => {
    it('should not throw error if entire notification configuration is missing', () => {
      assert.doesNotThrow(() => {
        new NotificationService();
      });
    });

    it('should throw error due to missing all mandatory fields in config', () => {
      assert.throws(() => {
        new NotificationService({});
      }, new Error('Kafka broker list was not provided'));
    });

    it('should successfully create a notification connector', () => {
      const notification = new NotificationService(config.notification);
      assert.ok(notification.kafka !== undefined);
      assert.strictEqual(notification.isConfigured(), true);
    });
    it('should return false for notification not being properly configured', () => {
      const notification = new NotificationService();
      assert.strictEqual(notification.isConfigured(), false);
    });
  });

  describe('Check notification params', () => {
    it('Notification without tag should fail', async () => {
      const notification = new NotificationService(config.notification);
      await assert.rejects(() => notification.send());
      await assert.rejects(() => notification.send('tag'));
    });
  });

  /// Remove .skip to actually run tests
  describe.skip('Check integration with Kafka', () => {
    let WebSocket, HttpServer, JwtToken, wsClient;
    let wsServer, http, notification, jwt, token

    before(() => {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      WebSocket = require('./../websocket/server');
      HttpServer = require('./../http/server');
      JwtToken = require('./../jwt/token.js');
      wsClient = require('ws');
      notification = new NotificationService(config.notification);
      jwt = new JwtToken(config.jwt);
      http = new HttpServer(config.http, config.jwt);
      wsServer = new WebSocket(http);
      token = jwt.generateToken(0, 'test', 1);
    });

    it('should report health status', async () => {
      assert.doesNotThrow(async () => {
        await notification.health();
      });
    });

    it('should send and receive a notification', async () => {
      const client = new wsClient('ws://localhost:' + config.http.port + '/?token=' + token);
      client.on('message', (message) => {
        const parsed = JSON.parse(message);
        if (parsed.command == 'authed') {
          return;
        }
        assert.strictEqual(parsed.command, 'notification');
        const payload = JSON.parse(parsed.payload);
        assert.strictEqual(payload.body, 'body');
        assert.strictEqual(payload.title, 'title');
        assert.strictEqual(payload.url, 'http://test.cern');
        client.terminate();
      });

      await notification.proxyWebNotificationToWs(wsServer);
      await notification.sendWebNotification('title', 'body', 'http://test.cern');
    });

    after(() => {
      wsServer.shutdown();
      http.close();
      notification.disconnectProxy();
    });
  });
});
