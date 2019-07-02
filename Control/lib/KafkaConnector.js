const kafka = require('kafka-node');
const log = new (require('@aliceo2/web-ui').Log)('Kafka');
/**
 * Gateway for all Kafka Consumer calls
 */
class KafkaConnector {
  /**
   * Setup KafkaConnector
   * @param {JSON} kafkaConfig - {hostname, port}
   */
  constructor(kafkaConfig) {
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
    if (!kafkaConfig.groupId) {
      missingConfigFields.push('groupId');
    }
    if (missingConfigFields.length > 0) {
      throw new Error(`[Kafka] Missing mandatory fields from configuration: ${missingConfigFields}`);
    }

    this.brokers = this._getHostNamesList(kafkaConfig.hostnames, kafkaConfig.port);
    this.port = kafkaConfig.port;
    this.topic = kafkaConfig.topic;
    this.groupId = kafkaConfig.groupId;
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
    consumerGroup.on('connect', () => log.info(`ConsumerGroup successfully connected to topic ${this.topic}`));
    consumerGroup.on('error', (error) => log.error(`Error on ${error}`));
    consumerGroup.on('offsetOutOfRange', (error) => log.error(`OffsetOutOfRange on ${error}`));
  }

  /**
   * Method to be executed when a message was received
   * @param {string} message
   */
  onMessage(message) {
    // TODO: [OGUI-358] send message on UI
    const messageDescription = JSON.stringify(JSON.parse(message.value).description);
    log.debug(messageDescription);
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
