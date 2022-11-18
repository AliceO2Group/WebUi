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

/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

const ControlService = require('./../../src/lib/control-core/ControlService.js');
const EnvCache = require('./../../src/lib/control-core/EnvCache.js');
const sinon = require('sinon');
const assert = require('assert');

describe('Env cache test suite', () => {
  describe('Test cache', () => {
    const res = {
      send: sinon.fake.returns(true)
    };
    const req = {};
    
    it('Add request to store', async() => {
      const getEnvsCallback = sinon.stub();
      getEnvsCallback.onCall(0).returns({environments: []});
      getEnvsCallback.onCall(1).returns({environments: [{id: "2X77oHbpaN9"}]});
      const ctrlProxy = {
        isConnectionReady: true,
        GetEnvironments: getEnvsCallback
      };
      const ctrl = new ControlService(ctrlProxy);
      const cache = new EnvCache(ctrl);
      await cache.refresh();
      assert.strictEqual(cache.cache.environments.length, 0);
      await cache.refresh();
      assert.strictEqual(cache.cache.environments.length, 1);
      assert.ok(cache.get(req, res));
    });
  });
});
