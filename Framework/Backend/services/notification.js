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

const { Kafka, logLevel } = require('kafkajs')
const WebSocketMessage = require('../websocket/message.js');
const log = new (require('./../log/Log.js'))(`${process.env.npm_config_log_label ?? 'framework'}/kafka`);

/**
 * Gateway for all Kafka notification service
 */
class NotificationService {
  /**
   * Prepares connector
   * @param {object} config Config with list of Kafka brokers
   */
  constructor(config) {
    if (!config) {
      log.warn('Missing configuration');
      return;
    }
    if (!config.brokers || config.brokers.length < 1) {
      throw new Error('Kafka broker list was not provided');
    }
    if (!config.topic) {
      this.topic = 'mattermost';
    } else {
      this.topic = config.topic;
    }
    this.kafka = new Kafka({
      clientId: 'webui',
      brokers: config.brokers,
      retry: {retries: 3},
      logLevel: logLevel.NOTHING
    });

    this.admin = this.kafka.admin();
    this.consumer = null;
    this.webSocket = null;
    log.info('Kafka connector configured');
  }

  /**
   * Check if Kafka was correctly configured
   * @return {boolean} States wheather service is correctly configured
   */
  isConfigured() {
    return (this.kafka !== undefined && this.admin !== undefined);
  }

  /**
   * Provides healthstatus of Kafka cluster
   * @returns {Promise}
   */
  async health() {
    await this.admin.connect();
    await this.admin.disconnect();
  }

  /**
   * Sends a message to selected topic
   * @param {string} topic Kafka topic
   * @param {string} message message to be sent
   * @returns {Promise}
   */
  async send(tag, title, url, extra) {
    if (!tag) {
      throw new Error('Tag is required to send notifications');
    }
    if (!title) {
      throw new Error('Title is required to send notifications');
    }
    const message = {
      tag: tag,
      title: title,
      url: url || undefined,
      extra: extra || undefined
    };
    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({topic: this.topic, messages: [{value: JSON.stringify(message)}]});
    await producer.disconnect();
  }

  /**
   * Receives notifications from given topic and broadcase them via WebSocket
   * @param {object} webSocket WebSocket server instance
   * @returns {Promise}
   */
  async proxyWebNotificationToWs(webSocket) {
    this.webSocket = webSocket;
    this.consumer = this.kafka.consumer({groupId: 'webnotification-group'});
    log.info('Listening for notifications');
    await this.consumer.connect();
    await this.consumer.subscribe({topic: 'webnotification', fromBeginning: false});
    await this.consumer.run({eachMessage: async ({topic, partition, message}) => {
      log.debug(`Received message on ${topic} topic from ${partition} partition`);
      this.webSocket.broadcast(
        new WebSocketMessage().setCommand('notification').setPayload(message.value.toString())
      );
    }});
  }

  /**
   * Disconnect consumer from Kafka
   * @returns {Promise}
   */
  disconnectProxy() {
    return this.consumer.disconnect();
  }
}

module.exports = NotificationService;
