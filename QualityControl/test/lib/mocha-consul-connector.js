const ConsulConnector = require('../../lib/ConsulConnector.js');
const config = require('../test-config.js');
const assert = require('assert');
const nock = require('nock');


describe('Consul Connector test suite', function() {
  describe('Check Initialization of ConsulConnector', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new ConsulConnector();
      }, new Error('Empty Consul config'));
    });

    it('should throw error due to empty hostname in consul config', function() {
      assert.throws(() => {
        new ConsulConnector({});
      }, new Error('Empty hostname in Consul config'));
    });

    it('should throw error due to empty port in consul config', function() {
      assert.throws(() => {
        new ConsulConnector({hostname: 'localhost'});
      }, new Error('Empty port in Consul config'));
    });

    it('should successfully create a consul connector', function() {
      const consul = new ConsulConnector(config.consul);
      assert.deepStrictEqual(consul.hostname, 'localhost');
      assert.deepStrictEqual(consul.port, 8500);
    });
  });

  describe('Get Tags from Services', function() {
    let consul;
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

    const servicesWithoutTags = {
      Main_QC_TASK:
      {
        ID: 'Main_QC_TASK',
        Service: 'Main_QC_TASK',
        Meta: {},
        Port: 80,
        Address: '',
        Weights: {Passing: 1, Warning: 1},
        EnableTagOverride: false
      }
    };
    before(function() {
      consul = new ConsulConnector(config.consul);
    });

    it('should successfully return a list of tags from a list of services', function() {
      const expectedTags = [{name: 'QcTask/example'}, {name: 'ITSRAWDS/example'}];
      const tags = consul.getTagsFromServices(services);
      assert.deepStrictEqual(tags, expectedTags);
    });

    it('should successfully return an empty list if there are no services', function() {
      const tags = consul.getTagsFromServices([]);
      assert.deepStrictEqual(tags, []);
    });

    it('should successfully return an empty list if services is undefined', function() {
      const tags = consul.getTagsFromServices(null);
      assert.deepStrictEqual(tags, []);
    });

    it('should successfully return an empty list if services is null', function() {
      const tags = consul.getTagsFromServices(undefined);
      assert.deepStrictEqual(tags, []);
    });

    it('should successfully return an empty list if services do not contain any any tags', function() {
      const tags = consul.getTagsFromServices(servicesWithoutTags);
      assert.deepStrictEqual(tags, []);
    });
  });

  describe('Check HTTP requests behaviour made towards Consul', function() {
    const consul = new ConsulConnector(config.consul);

    it('should successfully check if consul status is healthy', () => {
      nock('http://localhost:8500')
        .get('/v1/status/leader')
        .reply(200, `"localhost:8500"`);
      return consul.isConsulUpAndRunning().then((res) => assert.deepStrictEqual(res, 'localhost:8500'));
    });

    it('should reject with error if is unable to parse response from leader', async () => {
      nock('http://localhost:8500')
        .get('/v1/status/leader')
        .reply(200, `Unable to contact leader`);
      return assert.rejects(async () => {
        await consul.isConsulUpAndRunning();
      }, new Error('Unable to connect to Consul: Error: Unable to parse JSON'));
    });

    it('should reject with error if consul leader does not reply with 200 status code', async () => {
      nock('http://localhost:8500')
        .get('/v1/status/leader')
        .reply(500, `"Consul is not running"`);
      return assert.rejects(async () => {
        await consul.isConsulUpAndRunning();
      }, new Error('Unable to connect to Consul: Error: Non-2xx status code: 500'));
    });

    it('should reject with error if consul reports with error', () => {
      nock('http://localhost:8500')
        .get('/v1/status/leader')
        .replyWithError('Service unavailable');
      return assert.rejects(async () => {
        await consul.isConsulUpAndRunning();
      }, new Error('Unable to connect to Consul: Error: Service unavailable'));
    });

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

    const expectedServices = [
      {name: 'QcTask/example'},
      {name: 'ITSRAWDS/example'}
    ];

    it('should successfully receive a JSON and parse it in a list of services', () => {
      nock('http://localhost:8500')
        .get('/v1/agent/services')
        .reply(200, services);
      return consul.listOnlineObjects().then((res) => assert.deepStrictEqual(res, expectedServices));
    });

    it('should reject with error when requesting list of online objects and status is not ok', () => {
      nock('http://localhost:8500')
        .get('/v1/agent/services')
        .reply(500, services);
      return assert.rejects(async () => {
        await consul.listOnlineObjects();
      }, new Error('Non-2xx status code: 500'));
    });

    it('should reject with error if consul reports with error', () => {
      nock('http://localhost:8500')
        .get('/v1/agent/services')
        .replyWithError('Service unavailable');
      return assert.rejects(async () => {
        await consul.listOnlineObjects();
      }, new Error('Service unavailable'));
    });

    after(nock.restore);
    afterEach(nock.cleanAll);
  });
});
