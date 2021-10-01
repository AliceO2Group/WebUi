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
const url = require('url')

/**
 * Gateway for all Kafka notification service
 */
class KafkaConnector {
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
      throw new Error(`Kafka broker list was not provided`);
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
  async _send(topic, message) {
    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({topic: topic,messages: [{value: message}]});
    await producer.disconnect();
  }

  /**
   * Sends notification to mattermost channel
   * @param {string} channel Name of mattermost channel (as in channel URL)
   * @param {string} title   Title of notification
   * @param {string} link        URL referencing notification
   * @param {string} extra   Extra message that's displayed after clicking on "i" icon
   * @returns {Promise}
   */
  triggerMattermost(channel, title, link, extra) {
    if (!channel) {
      throw new Error('Mattermost notification channel needs to be set');
    }
    if (!title || title.length < 3) {
      throw new Error('Mattermost notification title needs to be at least 3 characters long');
    }
    if (!link || url.parse(link).host === null) {
      throw new Error('Mattermost notification URL needs to be correct');
    }
    return this._send('mattermost', JSON.stringify(
      {channel: channel, message: `${title}\n${link}`, extra: extra})
    );
  }

  /**
   * Sends notification in order to be display in WebUI-based GUI
   * @param {string} message Notification message
   * @returns {Promise}
   */
  triggerWebNotification(title, body, link) {
    if (!title || title.length < 3) {
      throw new Error('Web notification title needs to be at least 3 characters long');
    }
    if (!body) {
      throw new Error('Web notification body needs to be set');
    }
    if (!link || url.parse(link).host === null) {
      throw new Error('Web notification URL needs to be correct');
    }
    return this._send('webnotification', JSON.stringify({title: title, body: body, url: link}));
  }

  /**
   * Sends notification as email
   * @param {string} recipients Comma separated list of recipients
   * @param (string subject
   * @param {string} body
   *  @returns {Promise}
   */
  triggerEmailNotification(recipients, subject, body) {
    if (!recipients) {
      throw new Error('Email notification recipients need to be set');
    }
    // eslint-disable-next-line max-len
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    console.log(recipients)
    for(const email of recipients.split(',')) {
      if (!re.test(String(email).toLowerCase())) {
        throw new Error('Notification recipient email address incorrect: ' + email);
      }
    }
    if (!subject || subject.length < 3) {
      throw new Error('Email notification subject needs to be at least 3 characters long');
    }
    if (!body) {
      throw new Error('Email notification body needs to be set');
    }
    return this._send('email', JSON.stringify({to_addresses: recipients, body: body, subject: subject}));
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

module.exports = KafkaConnector;
