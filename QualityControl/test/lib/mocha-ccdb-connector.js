const assert = require('assert');
const config = require('./../test-config.js');
const nock = require('nock');

const CCDBConnector = require('../../lib/CCDBConnector.js');

describe('CCDB Connector Test Suite', () => {
  let ccdb;
  before(() => ccdb = new CCDBConnector(config.ccdb));

  describe('Tests for creating a new CCDBConnector instance', () => {
    it('should throw an error if config is not provided', () => {
      assert.throws(() => new CCDBConnector(), new Error('Empty CCDB config'));
    });

    it('should throw an error if config hostname is not provided', () => {
      assert.throws(() => new CCDBConnector({}), new Error('Empty hostname in CCDB config'));
    });

    it('should throw an error if config port is not provided', () => {
      assert.throws(() => new CCDBConnector({hostname: 'localhost'}), new Error('Empty port in CCDB config'));
    });

    it('should successfully create an instance of CCDBConnector', () => {
      assert.doesNotThrow(() => new CCDBConnector(config.ccdb));
    });
  });

  describe('Tests for `testConnection()`', () => {
    it('should successfully check if CCDB is connected', () => {
      nock('http://localhost:8500').get('/latest').reply(200, `"localhost:8500"`);
      return ccdb.testConnection().then((res) => assert.ok(res));
    });

    it('should reject with error if CCDB does not reply with 200 status code', () => {
      nock('http://localhost:8500').get('/latest').reply(500, 'CCDB is not running');
      return assert.rejects(async () => {
        await ccdb.testConnection();
      }, new Error('Non-2xx status code: 500'));
    });

    it('should reject with error if CCDB reports with error', () => {
      nock('http://localhost:8500').get('/latest').replyWithError('Service unavailable');
      return assert.rejects(async () => {
        await ccdb.testConnection();
      }, new Error('Service unavailable'));
    });
  });

  describe('Tests for `getObjectTimestampList()`', () => {
    it('should successfully return a list of timestamps from QC objects', () => {
      const data = {
        objects: [
          {name: 'qc/test/1', createTime: 1},
          {name: 'qc/test/2', createTime: 2},
          {name: 'qc/test/3', createTime: 3},
        ]
      };
      const expectedList = [1, 2, 3];
      nock('http://localhost:8500').get('/browse/qc/test').reply(200, data);
      return ccdb.getObjectTimestampList('qc/test').then((res) => assert.deepStrictEqual(res, expectedList));
    });
  });

  describe('Test suite for `listObjects()`', () => {
    it('should successfully return a list of objects with only their name, createTime and lastModified', () => {
      const data = {
        objects: [
          {name: 'qc/test/1', createTime: 1, lastModified: 2, path: 'qc/test/1'},
          {name: 'qc/test/2', createTime: 2, lastModified: 2, path: 'qc/test/2'},
          {name: 'qc/test/3', createTime: 3, lastModified: 3, path: 'qc/test/3'},
        ]
      };
      const expectedList = [
        {name: 'qc/test/1', createTime: 1, lastModified: 2},
        {name: 'qc/test/2', createTime: 2, lastModified: 2},
        {name: 'qc/test/3', createTime: 3, lastModified: 3},
      ];
      nock('http://localhost:8500').get('/latest/.*').reply(200, data);
      return ccdb.listObjects('qc/test').then((res) => assert.deepStrictEqual(res, expectedList));
    });

    it('should successfully return a list of objects ignoring those with no path set', () => {
      const data = {
        objects: [
          {name: 'qc/test/1', createTime: 1, lastModified: 2, path: 'qc/test/1'},
          {name: 'qc/test/2', createTime: 2, lastModified: 2},
          {name: 'qc/test/3', createTime: 3, lastModified: 3, path: 'qc/test/3'},
        ]
      };
      const expectedList = [
        {name: 'qc/test/1', createTime: 1, lastModified: 2},
        {name: 'qc/test/3', createTime: 3, lastModified: 3},
      ];
      nock('http://localhost:8500').get('/latest/.*').reply(200, data);
      return ccdb.listObjects('qc/test').then((res) => assert.deepStrictEqual(res, expectedList));
    });

    it('should successfully return a list of objects ignoring those with wrong path set', () => {
      const data = {
        objects: [
          {name: 'qc/test/1', createTime: 1, lastModified: 2, path: 'qc/test/1'},
          {name: 'qc/test/3', createTime: 3, lastModified: 3, path: 'qctest3'},
        ]
      };
      const expectedList = [
        {name: 'qc/test/1', createTime: 1, lastModified: 2},
      ];
      nock('http://localhost:8500').get('/latest/.*').reply(200, data);
      return ccdb.listObjects('qc/test').then((res) => assert.deepStrictEqual(res, expectedList));
    });
  });

  after(nock.restore);
  afterEach(nock.cleanAll);
});
