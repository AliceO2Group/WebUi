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

const KafkaConnector = require('./../../lib/KafkaConnector.js');
const config = require('../test-config.js').kafka;
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

    it('should return true when kafka is properly configured', () => {
      assert.deepStrictEqual(kafka.isKafkaConfigured(), true);
    });

    it('should return false for kafka not being properly configured', () => {
      const kafka = new KafkaConnector();
      assert.deepStrictEqual(kafka.isKafkaConfigured(), false);
    });
  });
});
