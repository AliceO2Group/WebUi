const assert = require('assert');
const nock = require('nock');

const CCDBConnector = require('../../lib/CCDBConnector.js');
const config = require('../test-config.js');

describe('CCDB Connector test suite', () => {
  describe('Creating a new CCDBConnector instance', () => {
    it('should throw an error if configuration object is not provided', () => {
      assert.throws(() => new CCDBConnector(), new Error('Empty CCDB config'));
      assert.throws(() => new CCDBConnector(null), new Error('Empty CCDB config'));
      assert.throws(() => new CCDBConnector(undefined), new Error('Empty CCDB config'));
    });

    it('should throw an error if configuration object is missing hostname field', () => {
      assert.throws(() => new CCDBConnector({}), new Error('Empty hostname in CCDB config'));
    });

    it('should throw an error if configuration object is missing port field', () => {
      assert.throws(() => new CCDBConnector({hostname: 'localhost'}), new Error('Empty port in CCDB config'));
    });

    it('should successfully initialize CCDBConnector', () => {
      assert.doesNotThrow(() => new CCDBConnector({hostname: 'localhost', port: 8080}));
    });
  });
  describe('`getPrefix()` tests', () => {
    let ccdb;
    before(() => ccdb = new CCDBConnector(config.ccdb));

    it('successfully return empty string when no prefix is provided in config object', () => {
      const configNoPrefix = {};
      assert.strictEqual(ccdb.getPrefix(configNoPrefix), '');
    });
    it('successfully return prefix with no forward slash', () => {
      const configNoPrefix = {prefix: '/qc'};
      assert.strictEqual(ccdb.getPrefix(configNoPrefix), 'qc');
    });
    it('successfully return prefix with no backslash', () => {
      const configNoPrefix = {prefix: 'qc/'};
      assert.strictEqual(ccdb.getPrefix(configNoPrefix), 'qc');
    });
  });

  describe('`testConnection()` tests', () => {
    let ccdb;
    before(() => ccdb = new CCDBConnector(config.ccdb));

    it('should successfully test connection to CCDB', async () => {
      nock('http://ccdb:8500')
        .get('/browse/test')
        .reply(200, {objects: [], subfolders: []});

      await assert.doesNotReject(ccdb.testConnection());
    });

    it('should return rejected promise when attempting to test connection on CCDB', async () => {
      await assert.rejects(ccdb.testConnection(),
        new Error('Unable to connect to CCDB due to: Error: getaddrinfo ENOTFOUND ccdb ccdb:8500')
      );
    });
  });

  describe('`listObjects()` tests', () => {
    it('should successfully return a list of the objects', async () => {
      const ccdb = new CCDBConnector(config.ccdb);
      const objects = [
        {path: 'object/one', createTime: '101', lastModified: '102', id: 'id', metadata: []},
        {path: 'object/two', createTime: '101', lastModified: '102', id: 'id', metadata: []},
        {path: 'object/three', createTime: '101', lastModified: '102', id: 'id', metadata: []},
      ];
      const expectedObjects = [
        {name: 'object/one', createTime: 101, lastModified: 102},
        {name: 'object/two', createTime: 101, lastModified: 102},
        {name: 'object/three', createTime: 101, lastModified: 102}
      ];
      nock('http://ccdb:8500')
        .get('/latest/test.*')
        .reply(200, {objects: objects, subfolders: []});

      await ccdb.listObjects().then((result) => {
        assert.deepStrictEqual(result, expectedObjects);
      });
    });
  });

  describe('`itemTransform()` tests', () => {
    let ccdb;
    before(() => ccdb = new CCDBConnector(config.ccdb));

    it('should successfully return null for an item with missing path', () => {
      assert.strictEqual(ccdb.itemTransform({}), null);
      assert.strictEqual(ccdb.itemTransform({path: undefined}), null);
      assert.strictEqual(ccdb.itemTransform({path: null}), null);
      assert.strictEqual(ccdb.itemTransform({path: ''}), null);
    });
    it('should successfully return null for an item with a path missing a forward slash(/)', () => {
      assert.strictEqual(ccdb.itemTransform({path: 'wrongPath'}), null);
    });
    it('should successfully return a JSON with 3 fields if item fits criteria', () => {
      const item = {
        path: 'correct/path', createTime: '101', lastModified: '102', id: 'id', metadata: []
      };
      const expectedItem = {name: 'correct/path', createTime: 101, lastModified: 102};
      assert.deepStrictEqual(ccdb.itemTransform(item), expectedItem);
    });
  });

  describe('`httGetJson()` tests', () => {
    let ccdb;
    before(() => ccdb = new CCDBConnector(config.ccdb));

    it('should successfully return a list of the objects', async () => {
      nock('http://ccdb:8500')
        .get('/latest/test.*')
        .reply(200, '{}');

      await assert.doesNotReject(ccdb.httpGetJson('/latest/test.*'));
    });

    it('should reject with error due to status code', async () => {
      nock('http://ccdb:8500')
        .get('/latest/test.*')
        .reply(502, 'Some error');

      await assert.rejects(ccdb.httpGetJson('/latest/test.*'), new Error('Non-2xx status code: 502'));
    });

    it('should reject with error due to bad JSON body', async () => {
      nock('http://ccdb:8500')
        .get('/latest/test.*')
        .reply(200, 'Bad formatted JSON');

      await assert.rejects(ccdb.httpGetJson('/latest/test.*'), new Error('Unable to parse JSON'));
    });
  });

  after(nock.restore);
  afterEach(nock.cleanAll);
});
