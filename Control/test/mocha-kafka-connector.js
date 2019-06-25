const KafkaConnector = require('../lib/KafkaConnector.js');
const config = require('./test-config.js');
const assert = require('assert');

describe('Kafka Connector test suite', function() {
  describe('Check Initialization of KafkaConnector', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new KafkaConnector();
      }, new Error('Missing Kafka configuration'));
    });

    it('should throw error due to empty hostname in kafka config', function() {
      assert.throws(() => {
        new KafkaConnector({});
      }, new Error('Missing Kafka hostname'));
    });

    it('should throw error due to empty port in kafka config', function() {
      assert.throws(() => {
        new KafkaConnector({hostname: 'localhost'});
      }, new Error('Missing Kafka port'));
    });

    it('should create a kafka connector', function() {
      const kafka = new KafkaConnector(config.kafka);
      assert.deepStrictEqual(kafka.hostname, 'localhost');
      assert.deepStrictEqual(kafka.port, 9092);
    });
  });
});
