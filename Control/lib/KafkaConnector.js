const kafka = require('kafka-node');
const log = new (require('@aliceo2/web-ui').Log)('gRPC');
/**
 * Gateway for all Kafka Consumer calls
 */
class KafkaConnector {
  /**
   * Setup KafkaConnector
   * @param {JSON} config - {hostname, port}
   */
  constructor(config) {
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
    this.initializeKafkaConsumerGroup();
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

    consumerGroup.on('message', (message) => this.onMessage(message));
    consumerGroup.on('connect', () => log.info('[Kafka] - ConsumerGroup successfully connected'));
    consumerGroup.on('error', (error) => log.error(`[Kafka] - Error on ${error}`));
    consumerGroup.on('offsetOutOfRange', (error) => log.error(`[Kafka] - OffsetOutOfRange on ${error}`));
  }

  /**
   * Method to be executed when a message was received
   * @param {string} message
   */
  onMessage(message) {
    // TODO: [OGUI-358] send message on UI
    log.info(message);
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
