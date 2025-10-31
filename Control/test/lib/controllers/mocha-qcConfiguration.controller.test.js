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

const { QCConfigurationController } = require('../../../lib/controllers/QCConfiguration.controller.js');
const { QCConfigurationService } = require('../../../lib/services/QCConfiguration.service.js');

describe(`'QCConfigurationController' test suite`, () => {
  let qcConfigurationService, qcConfigurationController, req, res, statusStub, jsonStub;

  beforeEach(() => {
    qcConfigurationService = new QCConfigurationService({});
    qcConfigurationService.retrieveKeysOfValidConfigurations = sinon.stub();
    qcConfigurationService.retrieveConfigurationByKey = sinon.stub();

    qcConfigurationController = new QCConfigurationController(
      qcConfigurationService,
      { consul: { qcPath: 'o2/components/qc' } }
    );
    
    jsonStub = sinon.stub();
    statusStub = sinon.stub().returns({ json: jsonStub });
    res = { status: statusStub };
    req = { query: {}, params: {} };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe(`'getConfigurationsKeysHandler' test suite`, () => {
    it('should return 200 with keys when valid configurations are found (no prefix)', async () => {
      const keys = ['o2/components/qc/ANY/any/prefix1', 'o2/components/qc/ANY/any/prefix2'];
      qcConfigurationService.retrieveKeysOfValidConfigurations.resolves(keys);

      await qcConfigurationController.getConfigurationsKeysHandler(req, res);

      assert.ok(statusStub.calledWith(200));
      assert.deepStrictEqual(jsonStub.firstCall.args[0], keys);
      assert.ok(qcConfigurationService.retrieveKeysOfValidConfigurations.calledWith('o2/components/qc/ANY/any', false));
    });

    it('should return 200 with keys when a prefix is provided', async () => {
      const keys = ['o2/components/qc/ANY/any/dir1/prefix1'];
      qcConfigurationService.retrieveKeysOfValidConfigurations.resolves(keys);
      req.query.prefix = 'dir1';

      await qcConfigurationController.getConfigurationsKeysHandler(req, res);

      assert.ok(statusStub.calledWith(200));
      assert.deepStrictEqual(jsonStub.firstCall.args[0], keys);
      assert.ok(qcConfigurationService.retrieveKeysOfValidConfigurations
        .calledWith('o2/components/qc/ANY/any/dir1', false));
    });
    
    it('should return 200 with keys when recurse is true', async () => {
      const keys = ['o2/components/qc/ANY/any/dir1/prefix1', 'o2/components/qc/ANY/any/prefix2'];
      qcConfigurationService.retrieveKeysOfValidConfigurations.resolves(keys);
      req.query.recurse = true;
      req.query.prefix = 'dir1';

      await qcConfigurationController.getConfigurationsKeysHandler(req, res);

      assert.ok(statusStub.calledWith(200));
      assert.deepStrictEqual(jsonStub.firstCall.args[0], keys);
      assert.ok(qcConfigurationService.retrieveKeysOfValidConfigurations
        .calledWith('o2/components/qc/ANY/any/dir1', true));
    });

    it('should return 404 when service returns an empty array', async () => {
      qcConfigurationService.retrieveKeysOfValidConfigurations.resolves([]);

      await qcConfigurationController.getConfigurationsKeysHandler(req, res);

      assert.ok(statusStub.calledWith(404));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, 'No valid configurations found');
    });

    it('should return 404 when service returns null', async () => {
      qcConfigurationService.retrieveKeysOfValidConfigurations.resolves(null);

      await qcConfigurationController.getConfigurationsKeysHandler(req, res);

      assert.ok(statusStub.calledWith(404));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, 'No valid configurations found');
    });

    it('should return 404 when service throws a "404" error for a non-existent prefix', async () => {
      const prefix = 'nonexistent';
      req.query.prefix = prefix;
      const expectedPath = `o2/components/qc/ANY/any/${prefix}`;
      qcConfigurationService.retrieveKeysOfValidConfigurations.rejects(new Error('Non-2xx status code: 404'));
      
      await qcConfigurationController.getConfigurationsKeysHandler(req, res);
      
      assert.ok(statusStub.calledWith(404));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, `Configurations prefix not found: '${expectedPath}'`);
    });

    it('should return 503 when service throws a service unavailable error', async () => {
      qcConfigurationService.retrieveKeysOfValidConfigurations.rejects(new Error('Consul not working'));
      
      await qcConfigurationController.getConfigurationsKeysHandler(req, res);
      
      assert.ok(statusStub.calledWith(503));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, 'Consul service unavailable');
    });
  });

  describe(`'getConfigurationByKeyHandler' test suite`, () => {
    it('should return 200 with configuration for a valid key', async () => {
      const config = { key1: 'value1' };
      const configKey = 'o2/qc/path/config1';
      req.params.key = configKey;
      qcConfigurationService.retrieveConfigurationByKey.resolves(config);

      await qcConfigurationController.getConfigurationByKeyHandler(req, res);

      assert.ok(qcConfigurationService.retrieveConfigurationByKey.calledWith(configKey));
      assert.ok(statusStub.calledWith(200));
      assert.deepStrictEqual(jsonStub.firstCall.args[0], config);
    });

    it('should return 400 if key is missing', async () => {
      req.params.key = undefined;
      
      await qcConfigurationController.getConfigurationByKeyHandler(req, res);
      
      assert.ok(statusStub.calledWith(400));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, 'Missing configuration key');
    });

    it('should return 400 if key is an empty string', async () => {
      req.params.key = '  ';
        
      await qcConfigurationController.getConfigurationByKeyHandler(req, res);
        
      assert.ok(statusStub.calledWith(400));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, 'Missing configuration key');
    });

    it('should return 404 when service throws a "404" error for a non-existent key', async () => {
      const nonExistentKey = 'non-existent-key';
      req.params.key = nonExistentKey;
      qcConfigurationService.retrieveConfigurationByKey.rejects(new Error('Non-2xx status code: 404'));

      await qcConfigurationController.getConfigurationByKeyHandler(req, res);

      assert.ok(statusStub.calledWith(404));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, `Configuration not found for key: ${nonExistentKey}`);
    });

    it('should return 503 when service throws a service unavailable error', async () => {
      req.params.key = 'some-key';
      qcConfigurationService.retrieveConfigurationByKey.rejects(new Error('Consul not working'));

      await qcConfigurationController.getConfigurationByKeyHandler(req, res);
      
      assert.ok(statusStub.calledWith(503));
      assert.deepStrictEqual(jsonStub.firstCall.args[0].message, 'Consul service unavailable');
    });
  });
  
  describe(`'putConfigurationByKeyHandler' test suite`, () => {
    let qcConfigurationService, qcConfigurationController;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        putListOfKeyValues: sinon.stub().resolves({ allPut: true }),
      });

      qcConfigurationController = new QCConfigurationController(qcConfigurationService, {
        consul: { qcPath: 'o2/components/qc' },
      });
    });

    it('should return {allPut: true} for a valid key and configuration', async () => {
      const req = {
        params: { key: 'o2/components/qc/ANY/any/prefix1' },
        body: { configuration: { key1: 'value1', key2: 'value2' } },
      };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.putConfigurationByKeyHandler(req, res);
      assert.ok(res.status.calledWith(200));
      assert.deepStrictEqual(res.json.firstCall.args[0], { allPut: true });
    });

    it('should return 400 for missing configuration key', async () => {
      const req = { params: {}, body: { configuration: {} } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.putConfigurationByKeyHandler(req, res);
      assert.ok(res.status.calledWith(400));
      assert.deepStrictEqual(res.json.firstCall.args[0], {
        message: 'Missing configuration key',
        status: 400,
        title: 'Invalid Input',
      });
    });
  });
});
