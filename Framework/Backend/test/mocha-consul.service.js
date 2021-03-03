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
const ConsulService = require('./../services/consul.service.js');
const config = require('./test-config.js');
const assert = require('assert');
const nock = require('nock');

describe('Consul Service test suite', function() {
  describe('Check Initialization of ConsulService', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new ConsulService();
      }, new Error('[Consul] Configuration field cannot be empty'));
    });

    it('should throw error due to empty hostname in consul config', function() {
      assert.throws(() => {
        new ConsulService({});
      }, new Error('[Consul] Hostname field cannot be empty'));
    });

    it('should throw error due to empty port in consul config', function() {
      assert.throws(() => {
        new ConsulService({hostname: 'localhost'});
      }, new Error('[Consul] Port field cannot be empty'));
    });

    it('should successfully create a consul connector', function() {
      const consul = new ConsulService(config.consul);
      assert.deepStrictEqual(consul.hostname, 'localhost');
      assert.deepStrictEqual(consul.port, 8080);
    });

    it('should successfully set default values for API paths', function() {
      const consul = new ConsulService(config.consul);
      assert.deepStrictEqual(consul.servicesPath, '/v1/agent/services');
      assert.deepStrictEqual(consul.kvPath, '/v1/kv/');
      assert.deepStrictEqual(consul.leaderPath, '/v1/status/leader');
      assert.deepStrictEqual(consul.txnPath, '/v1/txn');
    });
  });

  describe('Check `getConsulLeaderStatus()`', function() {
    const consul = new ConsulService(config.consul);

    it('should successfully check if consul status is healthy', () => {
      nock('http://localhost:8080')
        .get('/v1/status/leader')
        .reply(200, `"localhost:8080"`);
      return consul.getConsulLeaderStatus().then((res) => assert.deepStrictEqual(res, 'localhost:8080'));
    });

    it('should reject with error if is unable to parse response from leader', async () => {
      nock('http://localhost:8080')
        .get('/v1/status/leader')
        .reply(200, `Unable to contact leader`);
      return assert.rejects(async () => {
        await consul.getConsulLeaderStatus();
      }, new Error('Unable to parse JSON'));
    });

    it('should reject with error if consul leader does not reply with 200 status code', async () => {
      nock('http://localhost:8080')
        .get('/v1/status/leader')
        .reply(500, 'Consul is not running');
      return assert.rejects(async () => {
        await consul.getConsulLeaderStatus();
      }, new Error('Non-2xx status code: 500'));
    });

    it('should reject with error if consul reports with error', () => {
      nock('http://localhost:8080')
        .get('/v1/status/leader')
        .replyWithError('Service unavailable');
      return assert.rejects(async () => {
        await consul.getConsulLeaderStatus();
      }, new Error('Service unavailable'));
    });
  });

  describe('Check various ways of retrieving keys', function() {
    const consul = new ConsulService(config.consul);
    it('should successfully build a call to retrieve all keys', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/?keys=true')
        .reply(200, ['a/b', 'b/c']);
      return consul.getKeys().then((res) => assert.deepStrictEqual(res, ['a/b', 'b/c']));
    });

    it('should successfully build the call to retrieve keys with a predefined keyPrefix', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/?keys=true')
        .reply(200, ['keyprefix/somekey']);
      return consul.getKeysByPrefix('keyprefix').then((res) => assert.deepStrictEqual(res, ['keyprefix/somekey']));
    });

    it('should successfully build the call to retrieve keys with a predefined keyPrefix in format `/keyprefix` ', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/?keys=true')
        .reply(200, ['keyprefix/somekey']);
      return consul.getKeysByPrefix('/keyprefix').then((res) => assert.deepStrictEqual(res, ['keyprefix/somekey']));
    });

    it('should successfully build the call to retrieve keys with a predefined keyPrefix in format `keyprefix/` ', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/?keys=true')
        .reply(200, ['keyprefix/somekey']);
      return consul.getKeysByPrefix('keyprefix/').then((res) => assert.deepStrictEqual(res, ['keyprefix/somekey']));
    });

    it('should successfully build the call to retrieve keys with a predefined keyPrefix in format `/keyprefix/` ', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/?keys=true')
        .reply(200, ['keyprefix/somekey']);
      return consul.getKeysByPrefix('/keyprefix/').then((res) => assert.deepStrictEqual(res, ['keyprefix/somekey']));
    });
  });

  describe('Check various ways of retrieving values based on key', function() {
    const consul = new ConsulService(config.consul);
    it('should successfully build a call to retrieve all keys', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/?keys=true')
        .reply(200, ['a/b', 'b/c']);
      return consul.getKeys().then((res) => assert.deepStrictEqual(res, ['a/b', 'b/c']));
    });

    it('should successfully build the call to retrieve a value by a key in format `key`', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/someotherkey')
        .reply(200, {key: 'keyprefix/someotherkey'});
      return consul.getValueObjectByKey('keyprefix/someotherkey').then((res) => assert.deepStrictEqual(res, {key: 'keyprefix/someotherkey'}));
    });

    it('should successfully build the call to retrieve a value by a key in format `/key/`', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/someotherkey')
        .reply(200, {key: 'keyprefix/someotherkey'});
      return consul.getValueObjectByKey('/keyprefix/someotherkey/').then((res) => assert.deepStrictEqual(res, {key: 'keyprefix/someotherkey'}));
    });

    it('should successfully build the call to retrieve a raw value by a key in format `/key/`', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix/someotherkey?raw=true')
        .reply(200, `"value"`);
      return consul.getOnlyRawValueByKey('/keyprefix/someotherkey/').then((res) => assert.deepStrictEqual(res, 'value'));
    });

    it('should successfully build the call to retrieve all values with a keyprefix in format `/key/`', function() {
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix?recurse=true')
        .reply(200, [{Key: 'keyprefix/some', Value: 'VGVzdFZhbHVl'}, {Key: 'keyprefix/other', Value: 'VGVzdFZhbHVl'}]);
      return consul.getValuesByKeyPrefix('/keyprefix/').then((res) => assert.deepStrictEqual(res, [{Key: 'keyprefix/some', Value: 'VGVzdFZhbHVl'}, {Key: 'keyprefix/other', Value: 'VGVzdFZhbHVl'}]));
    });

    it('should successfully build the call to retrieve all raw values with a keyprefix in format `/key/`', function() {
      const objectMeta = {Key: 'keyprefix/some', Value: 'VGVzdFZhbHVl', lastModified: 123456};
      const otherObjectMeta = {Key: 'keyprefix/other', Value: 'ewogbmFtZTogJ3Rlc3QnLAogdmFsdWU6ICd2YWx1ZScsCn0=', lastModified: 123456};
      nock('http://localhost:8080')
        .get('/v1/kv/keyprefix?recurse=true')
        .reply(200, [objectMeta, otherObjectMeta]);
      const expectedValue = 'TestValue';
      const expectedOtherValue = '{\n name: \'test\',\n value: \'value\',\n}';
      return consul.getOnlyRawValuesByKeyPrefix('/keyprefix/').then((res) => assert.deepStrictEqual(res, {'keyprefix/some': expectedValue, 'keyprefix/other': expectedOtherValue}));
    });
  });

  describe('Check various ways of retrieving services', () => {
    const services = {
      Main_QC_TASK:
      {
        ID: 'Main_QC_TASK',
        Service: 'Main_QC_TASK',
        Tags:
          [
            'QcTask/example',
            'ITSRAWDS/example'
          ],
        Meta: {},
        Port: 80,
        Address: '',
        Weights: {Passing: 1, Warning: 1},
        EnableTagOverride: false
      }
    };
    const consul = new ConsulService(config.consul);
    it('should successfully receive a JSON and parse it in a list of services', () => {
      nock('http://localhost:8080')
        .get('/v1/agent/services')
        .reply(200, services);
      return consul.getServices().then((res) => assert.deepStrictEqual(res, services));
    });
  });

  describe('Check PUT transaction calls', () => {
    it('should successfully send to consul a batch of transactions and all should succeed', async () => {
      const expectedBatches = [
        [...Array.from({length: 64}, (x, i) => (
          {KV: {Verb: 'set', Key: 'key', Value: Buffer.from(`value/${i}`).toString('base64')}}
        ))],
        [...Array.from({length: 6}, (x, i) => (
          {KV: {Verb: 'set', Key: 'key', Value: Buffer.from(`value/${i + 64}`).toString('base64')}}
        ))]
      ];
      nock('http://localhost:8080')
        .put('/v1/txn', expectedBatches[0])
        .reply(200, {});
      nock('http://localhost:8080')
        .put('/v1/txn', expectedBatches[1])
        .reply(200, {});
      const list = [...Array.from({length: 70}, (x, i) => ({key: `value/${i}`}))];
      const consul = new ConsulService(config.consul);
      const response = await consul.putListOfKeyValues(list);
      assert.deepStrictEqual(response, {allPut: true});
    });

    it('should successfully send to consul a batch of transactions and not all should succeed', async () => {
      const expectedBatches = [
        [...Array.from({length: 64}, (x, i) => (
          {KV: {Verb: 'set', Key: 'key', Value: Buffer.from(`value/${i}`).toString('base64')}}
        ))],
        [...Array.from({length: 6}, (x, i) => (
          {KV: {Verb: 'set', Key: 'key', Value: Buffer.from(`value/${i + 64}`).toString('base64')}}
        ))]
      ];
      nock('http://localhost:8080')
        .put('/v1/txn', expectedBatches[0])
        .reply(200, {});
      nock('http://localhost:8080')
        .put('/v1/txn', expectedBatches[1])
        .replyWithError('Service unavailable');
      const list = [...Array.from({length: 70}, (x, i) => ({key: `value/${i}`}))];
      const consul = new ConsulService(config.consul);
      const response = await consul.putListOfKeyValues(list);
      assert.deepStrictEqual(response, {allPut: false});
    });
    afterEach(nock.cleanAll);
  });

  describe('Check helper methods', () => {
    const consul = new ConsulService(config.consul);
    it('should successfully parse a given key', () => {
      assert.strictEqual(consul.parseKey('/some/key'), 'some/key');
      assert.strictEqual(consul.parseKey('some/key/'), 'some/key');
      assert.strictEqual(consul.parseKey('/some/key/'), 'some/key');
    });

    it('should successfully build request options for PUT call when data is string', () => {
      const data = 'some-string';
      const path = 'some-path';
      const options = consul._getRequestOptionsPUT(path, data);
      const expectedOptions = {
        hostname: config.consul.hostname,
        port: config.consul.port,
        path: path,
        method: 'PUT',
        headers: {'Content-Type': 'application/json', 'Content-Length': data.length}
      };
      assert.deepStrictEqual(options, expectedOptions);
    });

    it('should successfully build request options for PUT call when data is not string', () => {
      const data = {key: 'some-value'};
      const path = 'some-path';
      const options = consul._getRequestOptionsPUT(path, data);
      const expectedOptions = {
        hostname: config.consul.hostname,
        port: config.consul.port,
        path: path,
        method: 'PUT',
        headers: {'Content-Type': 'application/json', 'Content-Length': JSON.stringify(data).length}
      };
      assert.deepStrictEqual(options, expectedOptions);
    });

    it('should successfully build batches of max 64 with Consul Transaction Objects given a list of KV pairs', () => {
      const list = [...Array.from({length: 70}, (x, i) => ({key: `value/${i}`}))];
      const expectedBatches = [
        [...Array.from({length: 64}, (x, i) => (
          {KV: {Verb: 'set', Key: 'key', Value: Buffer.from(`value/${i}`).toString('base64')}}
        ))],
        [...Array.from({length: 6}, (x, i) => (
          {KV: {Verb: 'set', Key: 'key', Value: Buffer.from(`value/${i + 64}`).toString('base64')}}
        ))]
      ];

      const batches = consul._mapToConsulKVObjectsLists(list);
      assert.deepStrictEqual(batches, expectedBatches);
    });
  });

  after(nock.restore);
  afterEach(nock.cleanAll);
});
