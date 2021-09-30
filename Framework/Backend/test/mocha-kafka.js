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

const KafkaConnector = require('./../services/kafka.js');
const config = require('./../config-default.json').kafka;
const assert = require('assert');

describe('Kafka Connector test suite', () => {
  describe('Check Initialization of KafkaConnector', () => {
    it('should not throw error if entire kafka configuration is missing', () => {
      assert.doesNotThrow(() => {
        new KafkaConnector();
      });
    });

    it('should throw error due to missing all mandatory fields in config', () => {
      assert.throws(() => {
        new KafkaConnector({});
      }, new Error('Kafka broker list was not provided'));
    });

    it('should successfully create a kafka connector', () => {
      const kafka = new KafkaConnector(config);
      assert(kafka.kafka !== undefined);
      assert.deepStrictEqual(kafka.isConfigured(), true);
    });
    it('should return false for kafka not being properly configured', () => {
      const kafka = new KafkaConnector();
      assert.deepStrictEqual(kafka.isConfigured(), false);
    });

  });

});
