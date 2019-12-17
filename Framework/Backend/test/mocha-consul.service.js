/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const ConsulService = require('./../services/consul.service.js');
const config = require('./test-config.js');
const assert = require('assert');


describe('Consul Service test suite', function() {
  describe('Check Initialization of ConsulService', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new ConsulService();
      }, new Error('Configuration field cannot be empty'));
    });

    it('should throw error due to empty hostname in consul config', function() {
      assert.throws(() => {
        new ConsulService({});
      }, new Error('Hostname field cannot be empty'));
    });

    it('should throw error due to empty port in consul config', function() {
      assert.throws(() => {
        new ConsulService({hostname: 'localhost'});
      }, new Error('Port field cannot be empty'));
    });

    it('should successfully create a consul connector', function() {
      const consul = new ConsulService(config.consul);
      assert.deepStrictEqual(consul.hostname, 'localhost');
      assert.deepStrictEqual(consul.port, 8080);
    });
  });
});
