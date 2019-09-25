const kafka = require('kafka-node');
const {WebSocketMessage} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)('Kafka');
/**
 * Gateway for all Kafka Consumer calls
 */
class KafkaConnector {
  /**
   * Setup KafkaConnector
   * @param {JSON} kafkaConfig - {hostname, port}
   * @param {WebSocket} webSocket
   */
  constructor(kafkaConfig, webSocket) {
    if (!kafkaConfig) {
      log.error('Missing configuration');
      return;
    }
    const missingConfigFields = [];
    if (!kafkaConfig.hostnames) {
      missingConfigFields.push('hostnames');
    }
    if (!kafkaConfig.port) {
      missingConfigFields.push('port');
    }
    if (!kafkaConfig.topic) {
      missingConfigFields.push('topic');
    }
    if (missingConfigFields.length > 0) {
      throw new Error(`[Kafka] Missing mandatory fields from configuration: ${missingConfigFields}`);
    }

    this.brokers = this._getHostNamesList(kafkaConfig.hostnames, kafkaConfig.port);
    this.port = kafkaConfig.port;
    this.topic = kafkaConfig.topic;
    this.consumerGroup = null;
    this.webSocket = webSocket;
  }

  /**
   * Initialize kafka client
   */
  initializeKafkaConsumerGroup() {
    const options = {
      kafkaHost: this.brokers
    };
    const consumerGroup = new kafka.ConsumerGroup(options, [this.topic]);

    consumerGroup.on('message', (message) => this.notifyUsers(message));
    consumerGroup.on('connect', () => log.info(`ConsumerGroup successfully connected to topic ${this.topic}`));
    consumerGroup.on('error', (error) => log.error(`Error on ${error}`));
    consumerGroup.on('offsetOutOfRange', (error) => log.error(`OffsetOutOfRange on ${error}`));
  }

  /**
   * Method to be executed when a message was received from registered kafka producer
   * @param {string} message
   */
  notifyUsers(message) {
    const msgJSON = JSON.parse(message.value);
    log.debug(msgJSON.description);

    const msg = new WebSocketMessage();
    msg.command = 'notification';
    msg.payload = msgJSON.description;
    this.webSocket.broadcast(msg);
  }

  /**
   * Check if Kafka was correctly configured
   * @return {boolean}
   */
  isKafkaConfigured() {
    return (this.port !== undefined && this.topic !== undefined && this.brokers !== undefined);
  }

  /**
   * Method to prepare list of hostnames
   * @param {string} hostnames
   * @param {number} port
   * @return {string}
   */
  _getHostNamesList(hostnames, port) {
    return hostnames.split(',').map((host) => host + `:${port}`).join(',');
  }
}

module.exports = KafkaConnector;
