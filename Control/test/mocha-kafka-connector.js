const KafkaConnector = require('../lib/KafkaConnector.js');
const config = require('./test-config.js').kafka;
const assert = require('assert');

describe('Kafka Connector test suite', function() {
  describe('Check Initialization of KafkaConnector', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new KafkaConnector();
      }, new Error('[Kafka] - Missing configuration'));
    });

    it('should throw error due to missing hostnames in config', function() {
      assert.throws(() => {
        new KafkaConnector({});
      }, new Error('[Kafka] - Missing hostnames'));
    });

    it('should throw error due to missing port in config', function() {
      assert.throws(() => {
        new KafkaConnector({hostnames: 'localhost'});
      }, new Error('[Kafka] - Missing port'));
    });

    it('should throw error due to missing topic in config', function() {
      assert.throws(() => {
        new KafkaConnector({hostnames: 'localhost', port: 9092});
      }, new Error('[Kafka] - Missing topic'));
    });

    it('should throw error due to missing groupId in config', function() {
      assert.throws(() => {
        new KafkaConnector({hostnames: 'localhost', port: 9092, topic: 'notifications'});
      }, new Error('[Kafka] - Missing groupId'));
    });

    it('should successfully create a kafka connector', function() {
      const kafka = new KafkaConnector(config);
      assert.deepStrictEqual(kafka.brokers, 'localhost:9092');
      assert.deepStrictEqual(kafka.port, 9092);
      assert.deepStrictEqual(kafka.topic, 'notifications');
      assert.deepStrictEqual(kafka.groupId, 'flp-kafka-notifications');
    });
  });

  describe('Check helper methods', () => {
    let kafka = null;
    before(() => {
      kafka = new KafkaConnector(config);
    });

    it('should successfully get create brokers for hostnames.length === 1', () => {
      const hostnames = 'localhost';
      const expectedHostNames = 'localhost:9092';
      const brokers = kafka._getHostNamesList(hostnames, 9092);
      assert.deepStrictEqual(brokers, expectedHostNames);
    });

    it('should successfully get create brokers for hostnames.length >== 1', () => {
      const hostnames = 'localhost,testhost,hostname';
      const expectedHostNames = 'localhost:9092,testhost:9092,hostname:9092';
      const brokers = kafka._getHostNamesList(hostnames, 9092);
      assert.deepStrictEqual(brokers, expectedHostNames);
    });
  });
});
