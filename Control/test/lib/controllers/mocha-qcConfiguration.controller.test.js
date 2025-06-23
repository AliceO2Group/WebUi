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

const assert = require('assert');
const sinon = require('sinon');

const { QCConfigurationController } = require('../../../lib/controllers/QCConfiguration.controller.js');
const { QCConfigurationService } = require('../../../lib/services/QCConfiguration.service.js');

describe(`'QCConfigurationController' test suite`, () => {
  describe(`'getConfigurationsKeys' test suite`, () => {
    let qcConfigurationService, qcConfigurationController;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        getOnlyRawValuesByKeyPrefix: sinon.stub().resolves({
          "o2/components/qc/ANY/any/dir1": undefined,
          "o2/components/qc/ANY/any/dir1/prefix1": '{"key1": "value1", "key2": "value2"}',
          "o2/components/qc/ANY/any/prefix1": '{"key1": "value1", "key2": "value2"}',
          "o2/components/qc/ANY/any/prefix2": '"key1": "value1"',
        }),
      });

      qcConfigurationController = new QCConfigurationController(qcConfigurationService, {consul: {qcPath: 'o2/components/qc'}});
    });

    it('should return keys of all valid configurations in main directory', async () => {
      const req = { query: { } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationsKeys(req, res);
      assert.ok(res.status.calledWith(200));
      assert.deepStrictEqual(res.json.firstCall.args[0], ['o2/components/qc/ANY/any/prefix1']);
    });

    it('should return keys of all valid configurations in prefix directory when prefix is set', async () => {
      const req = { query: { prefix: 'dir1' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationsKeys(req, res);
      assert.ok(res.status.calledWith(200));
      assert.deepStrictEqual(res.json.firstCall.args[0], ['o2/components/qc/ANY/any/dir1/prefix1']);
    });

    it('should return keys of all valid configurations when recurse is true', async () => {
      const req = { query: { recurse: true } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationsKeys(req, res);
      assert.ok(res.status.calledWith(200));
      assert.deepStrictEqual(res.json.firstCall.args[0], ['o2/components/qc/ANY/any/dir1/prefix1', 'o2/components/qc/ANY/any/prefix1']);
    });
  })

  describe(`'getConfigurationByKey' test suite`, () => {
    let qcConfigurationService, qcConfigurationController;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        getOnlyRawValueByKey: sinon.stub().resolves({"key1": "value1", "key2": "value2"}),
      });

      qcConfigurationController = new QCConfigurationController(qcConfigurationService, {consul: {qcPath: 'o2/components/qc'}});
    });
    
    it('should return configuration for a valid key', async () => {
      const req = { query: { key: 'o2/components/qc/ANY/any/prefix1' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationByKey(req, res);
      assert.ok(res.status.calledWith(200));
      assert.deepStrictEqual(res.json.firstCall.args[0], {key1: 'value1', key2: 'value2'});
    });

    it('should return 400 for missing configuration key', async () => {
      const req = { query: {} };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationByKey(req, res);
      assert.ok(res.status.calledWith(400));
      assert.deepStrictEqual(res.json.firstCall.args[0], {
        message: 'Missing configuration key',
        status: 400,
        title: 'Invalid Input',
      });
    });
  });

  describe(`'getConfigurationRestrictionsByKey' test suite`, () => {
    let qcConfigurationService, qcConfigurationController;
    before(() => {
      qcConfigurationService = new QCConfigurationService({
        getOnlyRawValueByKey: sinon.stub().resolves({
          qc: {
            bool: "true",
            numeric: "-90",
            text: "description",
            list: [
              "item 1",
              "item 2"
            ],
            nested: {
              moreText: "details",
              nextBool: "false",
              lastNumeric: "1.2e-3"
            }
          }
        }),
      });

      qcConfigurationController = new QCConfigurationController(qcConfigurationService, {consul: {qcPath: 'o2/components/qc'}});
    });
    
    it('should return configuration restrictions for a valid key', async () => {
      const req = { query: { key: 'o2/components/qc/ANY/any/prefix1' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationRestrictionsByKey(req, res);
      assert.ok(res.status.calledWith(200));
      assert.deepStrictEqual(res.json.firstCall.args[0], {
        qc: {
          bool: "boolean",
          numeric: "number",
          text: "string",
          list: "array",
          nested: {
            moreText: "string",
            nextBool: "boolean",
            lastNumeric: "number"
          }
        }
      });
    });

    it('should return 400 for missing configuration key', async () => {
      const req = { query: {} };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      await qcConfigurationController.getConfigurationRestrictionsByKey(req, res);
      assert.ok(res.status.calledWith(400));
      assert.deepStrictEqual(res.json.firstCall.args[0], {
        message: 'Missing configuration key',
        status: 400,
        title: 'Invalid Input',
      });
    });
  });
});
