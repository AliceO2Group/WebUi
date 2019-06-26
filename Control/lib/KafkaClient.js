const kafka = require('kafka-client');
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
      throw new Error('Missing Kafka configuration');
    }
    if (!config.hostname) {
      throw new Error('Missing Kafka hostname');
    }
    if (!config.port) {
      throw new Error('Missing Kafka port');
    }

    this.hostname = config.hostname;
    this.port = config.port;
  }

  /**
   * Method to check if expected Kafka Producer is healthy
   */
  async isKafkaProducerUpAndRunning() {
    return false;
  }

  /**
   * Initialize kafka client
   */
  async initializeKafkaClient() {
    const client = new kafka.KafkaClient({kafkaHost: '10.3.100.196:9092'});
  }
}

module.exports = KafkaConnector;
