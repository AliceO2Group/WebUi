const KafkaConnector = require('../lib/KafkaConnector.js');
const config = require('./test-config.js').kafka;
const assert = require('assert');

describe('Kafka Connector test suite', function() {
  describe('Check Initialization of KafkaConnector', function() {
    it('should not throw error if entire kafka field is missing from configuration', function() {
      assert.doesNotThrow(() => {
        new KafkaConnector();
      });
    });

    it('should throw error due to missing all mandatory fields in config', function() {
      assert.throws(() => {
        new KafkaConnector({});
      }, new Error('[Kafka] Missing mandatory fields from configuration: hostnames,port,topic'));
    });

    it('should throw error due to missing mandatory fields in config', function() {
      assert.throws(() => {
        new KafkaConnector({hostnames: 'localhost', topic: 'notifications'});
      }, new Error('[Kafka] Missing mandatory fields from configuration: port'));
    });

    it('should successfully create a kafka connector', function() {
      const kafka = new KafkaConnector(config);
      assert.deepStrictEqual(kafka.brokers, 'localhost:9092');
      assert.deepStrictEqual(kafka.port, 9092);
      assert.deepStrictEqual(kafka.topic, 'notifications');
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
