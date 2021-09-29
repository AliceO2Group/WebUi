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

const { Kafka } = require('kafkajs')
const WebSocketMessage = require('../websocket/message.js');
const log = new (require('./../log/Log.js'))(`${process.env.npm_config_log_label ?? 'web-ui'}/kafka`);

/**
 * Gateway for all Kafka notification service
 */
class KafkaConnector {
  /**
   * Prepares connector
   * @param {object} config Config with list of Kafka brokers
   */
  constructor(config) {
    if (config?.brokers?.length < 1) {
      throw new Error(`Kafka broker list was not provided`);
    }
    this.kafka = new Kafka({
      clientId: 'webui',
      brokers: config.brokers
    });
    this.consumer = null;
    this.webSocket = null;
  }

  /**
   * Sends a message to selected topic
   */
  _send(topic, message) {
    const producer = this.kafka.producer();
    return Promise.resolve()
      .then(() => producer.connect())
      .then(() => producer.send({topic: topic,messages: [{value: message}]}))
      .then(() => producer.disconnect());
  }

  /**
   * Sends notification to mattermost channel
   * @param {string} title Title of notification
   * @param {string} body  Body of notification
   */
  sendToMattermost(title, body) {
    return this._send('mattermost', JSON.stringify({description: `**${title}**\n${body}`, client_url: 'none', details: 'no details'}))
  }

  /**
   * Sends message in order to be display in WebUI-based GUI
   * @param {string} message Notification message
   */
  triggerWebNotification(message) {
    return this._send('webnotification', message);
  }

  /**
   * Receives notifications from given topic and broadcase them via WebSocket
   * @param {object} webSocket WebSocket server instance
   */
  proxyWebNotificationToWs(webSocket) {
    this.webSocket = webSocket;
    this.consumer = this.kafka.consumer({groupId: 'webnotification-group'});

    return Promise.resolve()
      .then(() => this.consumer.connect())
      .then(() => this.consumer.subscribe({topic: 'webnotification', fromBeginning: false}))
      .then(() => {
        return this.consumer.run({eachMessage: async ({topic, partition, message}) => {
          this.webSocket.broadcast(new WebSocketMessage().setCommand('notification').setPayload(message.value.toString()));
        }})
      });
  }
}
