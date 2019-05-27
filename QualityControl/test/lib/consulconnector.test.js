const ConsulConnector = require('./../../lib/ConsulConnector.js');
const config = require('./../test-config.js');
const assert = require('assert');

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

    it('should create a consul connector', function() {
      const consul = new ConsulConnector(config.consul);
      assert.deepStrictEqual(consul.hostname, 'localhost');
      assert.deepStrictEqual(consul.port, 7777);
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

    it('should return a list of tags from a list of services', function() {
      const expectedTags = [{name: 'QcTask/example'}, {name: 'ITSRAWDS/example'}];
      const tags = consul.getTagsFromServices(services);
      assert.deepStrictEqual(tags, expectedTags);
    });

    it('should return an empty list if there are no services', function() {
      const tags = consul.getTagsFromServices([]);
      assert.deepStrictEqual(tags, []);
    });

    it('should return an empty list if services is undefined', function() {
      const tags = consul.getTagsFromServices(null);
      assert.deepStrictEqual(tags, []);
    });

    it('should return an empty list if services is null', function() {
      const tags = consul.getTagsFromServices(undefined);
      assert.deepStrictEqual(tags, []);
    });

    it('should return an empty list if services do not contain any any tags', function() {
      const tags = consul.getTagsFromServices(servicesWithoutTags);
      assert.deepStrictEqual(tags, []);
    });
  });
});
