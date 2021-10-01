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
      assert.ok(kafka.kafka !== undefined);
      assert.strictEqual(kafka.isConfigured(), true);
    });
    it('should return false for kafka not being properly configured', () => {
      const kafka = new KafkaConnector();
      assert.strictEqual(kafka.isConfigured(), false);
    });
  });

  describe('Check trigger notification param parsing', () => {
    it('Mattermost notification without mandatory fields should fail', () => {
      const kafka = new KafkaConnector(config.kafka);
      assert.throws(() => {
        kafka.sendMattermostNotification();
      }, new Error('Mattermost notification channel needs to be set'));

      assert.throws(() => {
        kafka.sendMattermostNotification('channel', 'ti');
      }, new Error('Mattermost notification title needs to be at least 3 characters long'));

      assert.throws(() => {
        kafka.sendMattermostNotification('channel', 'title', '/path?query=a');
      }, new Error('Mattermost notification URL needs to be correct'));
    });
    it('Email notification without mandatory fields should fail', () => {
      const kafka = new KafkaConnector(config.kafka);
      assert.throws(() => {
        kafka.sendWebNotification();
      }, new Error('Web notification title needs to be at least 3 characters long'));

      assert.throws(() => {
        kafka.sendWebNotification('title');
      }, new Error('Web notification body needs to be set'));

      assert.throws(() => {
        kafka.sendWebNotification('title', 'body', '/path?query=a');
      }, new Error('Web notification URL needs to be correct'));
    });
    it('Email notification without mandatory fields should fail', () => {
      const kafka = new KafkaConnector(config.kafka);
      assert.throws(() => {
        kafka.sendEmailNotification();
      }, new Error('Email notification recipients need to be set'));

      assert.throws(() => {
        kafka.sendEmailNotification('wrong_email');
      }, new Error('Notification recipient email address incorrect: wrong_email'));

      assert.throws(() => {
        kafka.sendEmailNotification('correct@email.com,wrong_email');
      }, new Error('Notification recipient email address incorrect: wrong_email'));

      assert.throws(() => {
        kafka.sendEmailNotification('email@email.com');
      }, new Error('Email notification subject needs to be at least 3 characters long'));

      assert.throws(() => {
        kafka.sendEmailNotification('email@email.com', 'subject');
      }, new Error('Email notification body needs to be set'));

    });
  });

  /// Remove .skip to actually run tests
  describe.skip('Check integration with Kafka', () => {
    let WebSocket, HttpServer, JwtToken, wsClient;
    let wsServer, http, kafka, jwt, token

    before(() => {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      WebSocket = require('./../websocket/server');
      HttpServer = require('./../http/server');
      JwtToken = require('./../jwt/token.js');
      wsClient = require('ws');
      kafka = kafka = new KafkaConnector(config.kafka);
      jwt = new JwtToken(config.jwt);
      http = new HttpServer(config.http, config.jwt);
      wsServer = new WebSocket(http);
      token = jwt.generateToken(0, 'test', 1);
    });

    it('should report health status', async () => {
      assert.doesNotThrow(async () => {
        await kafka.health();
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

      await kafka.proxyWebNotificationToWs(wsServer);
      await kafka.sendWebNotification('title', 'body', 'http://test.cern');
    });

    after(() => {
      wsServer.shutdown();
      http.close();
      kafka.disconnectProxy();
    });
  });
});
