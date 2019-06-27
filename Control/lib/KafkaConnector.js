const kafka = require('kafka-node');
const {WebSocketMessage} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)('Kafka');
/**
 * Gateway for all Kafka Consumer calls
 */
class KafkaConnector {
  /**
   * Setup KafkaConnector
   * @param {JSON} config - {hostname, port}
   * @param {WebSocket} webSocket
   */
  constructor(config, webSocket) {
    if (!config) {
      throw new Error('[Kafka] - Missing configuration');
    }
    if (!config.hostnames) {
      throw new Error('[Kafka] - Missing hostnames');
    }
    if (!config.port) {
      throw new Error('[Kafka] - Missing port');
    }
    if (!config.topic) {
      throw new Error('[Kafka] - Missing topic');
    }
    if (!config.groupId) {
      throw new Error('[Kafka] - Missing groupId');
    }

    this.brokers = this._getHostNamesList(config.hostnames, config.port);
    this.port = config.port;
    this.topic = config.topic;
    this.groupId = config.groupId;
    this.consumerGroup = null;
    this.webSocket = webSocket;
  }

  /**
   * // TODO Method to check if expected Kafka Producer is healthy
   */
  async isKafkaProducerUpAndRunning() {
    return false;
  }

  /**
   * Initialize kafka client
   */
  initializeKafkaConsumerGroup() {
    const options = {
      kafkaHost: this.brokers,
      groupId: this.groupId
    };
    const consumerGroup = new kafka.ConsumerGroup(options, 'notifications');

    consumerGroup.on('message', (message) => this.notifyUsers(message));
    consumerGroup.on('connect', () => log.info('[Kafka] - ConsumerGroup successfully connected'));
    consumerGroup.on('error', (error) => log.error(`[Kafka] - Error on ${error}`));
    consumerGroup.on('offsetOutOfRange', (error) => log.error(`[Kafka] - OffsetOutOfRange on ${error}`));
  }

  /**
   * Method to be executed when a message was received
   * @param {string} message
   */
  notifyUsers(message) {
    // send message on UI
    const msgJSON = JSON.parse(message.value);
    const msg = new WebSocketMessage();
    msg.command = 'notification';
    msg.payload = msgJSON.description;
    log.info(msgJSON.description);
    this.webSocket.broadcast(msg);
  }

  /**
   * Method to prepare list of hostnames
   * @param {String} hostnames
   * @param {number} port
   * @return {String}
   */
  _getHostNamesList(hostnames, port) {
    return hostnames.split(',').map((host) => host + `:${port}`).join(',');
  }
}

module.exports = KafkaConnector;
