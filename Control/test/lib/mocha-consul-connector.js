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

const assert = require('assert');
const sinon = require('sinon');
const config = require('../test-config.js').consul;
const ConsulConnector = require('../../lib/ConsulConnector.js');

describe('ConsulConnector test suite', () => {
  let res;
  describe('Test ConsulConnector initialization', () => {
    it('should successfully initialize consul with "undefined" configuration', () => {
      const consul = new ConsulConnector({}, undefined);
      assert.strictEqual(consul.flpHardwarePath, 'o2/hardware/flps');
      assert.strictEqual(consul.readoutPath, 'o2/components/readout');
    });
    it('should successfully initialize consul with "null" configuration', () => {
      const consul = new ConsulConnector({}, null);
      assert.strictEqual(consul.flpHardwarePath, 'o2/hardware/flps');
      assert.strictEqual(consul.readoutPath, 'o2/components/readout');
    });
    it('should successfully initialize consul with "missing" configuration', () => {
      const consul = new ConsulConnector({});
      assert.strictEqual(consul.flpHardwarePath, 'o2/hardware/flps');
      assert.strictEqual(consul.readoutPath, 'o2/components/readout');
    });
    it('should successfully initialize consul with "passed" configuration', () => {
      const consul = new ConsulConnector({}, {
        flpHardwarePath: 'some/hardware/path',
        readoutPath: 'some/readout/path'
      });
      assert.strictEqual(consul.flpHardwarePath, 'some/hardware/path');
      assert.strictEqual(consul.readoutPath, 'some/readout/path');
    });
  });

  describe('Test Consul Connection', async () => {
    let consulService;
    beforeEach(() => consulService = {});
    it('should successfully query host of ConsulLeader', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().resolves('localhost:8500');
      const connector = new ConsulConnector(consulService, config);
      await connector.testConsulStatus();
    });
    it('should successfully query host of ConsulLeader and fail gracefully', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().rejects('Unable to query Consul');
      const connector = new ConsulConnector(consulService, config);
      await connector.testConsulStatus();
    });
  });

  describe('Request CRUs tests', async () => {
    let consulService;
    beforeEach(() => {
      res = {
        status: sinon.stub(),
        json: sinon.stub(),
        send: sinon.stub()
      };
      consulService = {};
    });
    it('should successfully query, filter, match and return a list of CRU names', async () => {
      consulService.getOnlyRawValuesByKeyPrefix = sinon.stub().resolves({
        'o2/hardware/flps/flpOne/cards': `{"0": {"type": "CRORC", "pciAddress": "d8:00.0"}}`,
        'o2/hardware/flps/flp1/info"': `{0: {"type": "should not be included"}}`
      });
      const connector = new ConsulConnector(consulService, config);

      await connector.getCRUs(null, res);
      const expectedCRUs = {flpOne: {0: {type: 'CRORC', pciAddress: 'd8:00.0'}}};

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(expectedCRUs));
    });

    // it('should successfully return 404 if consul did not send back any data for specified key', async () => {
    //   consulService.getOnlyRawValuesByKeyPrefix = sinon.stub().rejects({message: '404 - Key not found'});
    //   const connector = new ConsulConnector(consulService, 'some/path');
    //   const res2 = {
    //     status: sinon.stub(),
    //     json: sinon.stub(),
    //     send: sinon.stub()
    //   };
    //   await connector.getCRUs(null, res2);

    //   assert.ok(res2.status.calledWith(404));
    //   assert.ok(res2.send.calledWith({message: 'Could not find any Readout Cards by key some/path'}));
    // });

    // it('should successfully return 502 if consul did not respond', async () => {
    //   consulService.getOnlyRawValuesByKeyPrefix = sinon.stub().rejects({message: '502 - Consul unresponsive'});
    //   const connector = new ConsulConnector(consulService, 'some/path');
    //   await connector.getCRUs(null, res);

    //   assert.ok(res.status.calledWith(502));
    //   assert.ok(res.send.calledWith({message: '502 - Consul unresponsive'}));
    // });

    it('should successfully return error for when ConsulService was not initialized', async () => {
      const connector = new ConsulConnector(undefined, config);
      await connector.getCRUs(null, res);

      assert.ok(res.status.calledWith(502));
      assert.ok(res.send.calledWith({message: 'Unable to retrieve configuration of consul service'}));
    });
  });

  describe('Request FLPs tests', async () => {
    let consulService;
    beforeEach(() => {
      res = {
        status: sinon.stub(),
        json: sinon.stub(),
        send: sinon.stub()
      };
      consulService = {};
    });

    it('should successfully query, filter, match and return a list of FLP names', async () => {
      consulService.getKeysByPrefix = sinon.stub().resolves([
        'o2/hardware/flps/flpOne/cards',
        'o2/hardware/flps/flpTwo/info',
        'o2/hardware/notanflp/flp2/test',
      ]);
      const connector = new ConsulConnector(consulService, config);
      await connector.getFLPs(null, res);

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        flps: ['flpOne', 'flpTwo'],
        consulReadoutPrefix: 'localhost:8550/test/o2/readout/components/'
      }));
    });

    it('should successfully return a readout configuration prefix', async () => {
      consulService.getKeysByPrefix = sinon.stub().resolves([]);
      const connector = new ConsulConnector(consulService, config);
      await connector.getFLPs(null, res);

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        flps: [],
        consulReadoutPrefix: 'localhost:8550/test/o2/readout/components/'
      }));
    });

    it('should successfully return an empty readout configuration prefix if configuration host is missing', async () => {
      consulService.getKeysByPrefix = sinon.stub().resolves([]);
      const connector = new ConsulConnector(consulService, {port: 8550});
      await connector.getFLPs(null, res);

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        flps: [],
        consulReadoutPrefix: ''
      }));
    });

    it('should successfully return an empty readout configuration prefix if configuration port is missing', async () => {
      consulService.getKeysByPrefix = sinon.stub().resolves([]);
      const connector = new ConsulConnector(consulService, {hostname: 'localhost'});
      await connector.getFLPs(null, res);

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        flps: [],
        consulReadoutPrefix: ''
      }));
    });

    it('should successfully remove duplicates from list of FLP names', async () => {
      consulService.getKeysByPrefix = sinon.stub().resolves([
        'o2/hardware/flps/flpTwo/cards',
        'o2/hardware/flps/flpTwo/info'
      ]);
      const connector = new ConsulConnector(consulService, config);
      await connector.getFLPs(null, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({
        flps: ['flpTwo'],
        consulReadoutPrefix: 'localhost:8550/test/o2/readout/components/'
      }));
    });

    // it('should successfully return 404 if consul did not send back any data for specified key', async () => {
    //   consulService.getKeysByPrefix = sinon.stub().rejects({message: '404 - Key not found'});
    //   const connector = new ConsulConnector(consulService, 'some/path');
    //   await connector.getFLPs(null, res);

    //   assert.ok(res.status.calledWith(404));
    //   assert.ok(res.send.calledWith({message: 'Could not find any FLPs by key some/path'}));
    // });

    // it('should successfully return 502 if consul did not respond', async () => {
    //   consulService.getKeysByPrefix = sinon.stub().rejects({message: '502 - Consul unresponsive'});
    //   const connector = new ConsulConnector(consulService, 'some/path');
    //   await connector.getFLPs(null, res);

    //   assert.ok(res.status.calledWith(502));
    //   assert.ok(res.send.calledWith({message: '502 - Consul unresponsive'}));
    // });

    it('should successfully return error for when ConsulService was not initialized', async () => {
      const connector = new ConsulConnector(undefined, config);
      await connector.getFLPs(null, res);

      assert.ok(res.status.calledWith(502));
      assert.ok(res.send.calledWith({message: 'Unable to retrieve configuration of consul service'}));
    });
  });
});
