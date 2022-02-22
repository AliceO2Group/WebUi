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
const AssertionError = require('assert').AssertionError;
const sinon = require('sinon');

const {ObjectController} = require('../../../lib/controllers');
const CcdbService = require('../../../lib/services/CcdbService.js');

describe('ObjectController test suite', () => {
  describe('Creating a new ObjectController instance', () => {
    it('should throw an error if it is missing service for retrieving data', () => {
      assert.throws(() => new ObjectController(undefined),
        new AssertionError({message: 'Missing service for retrieving objects data', expected: true, operator: '=='}));
      assert.throws(() => new ObjectController(undefined),
        new AssertionError({message: 'Missing service for retrieving objects data', expected: true, operator: '=='}));
    });

    it('should successfully initialize ObjectController', () => {
      assert.doesNotThrow(() => new ObjectController({}));
    });
  });

  describe('`getObjectInfo()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });
    it('should respond with error if data connector could not find latest version', async () => {
      const jsonStub = sinon.createStubInstance(CcdbService, {
        getObjectLatestVersionByPath: sinon.stub().rejects(new Error('Failed to load data for object'))
      });
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
      const objController = new ObjectController(jsonStub);
      await objController.getObjectInfo(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Failed to load data for object'}), 'Error message was incorrect');
    });

    it('should respond with error if data connector could not find latest 50 timestamps', async () => {
      const jsonStub = sinon.createStubInstance(CcdbService, {
        getObjectLatestVersionByPath: sinon.stub().resolves({}),
        getObjectTimestampList: sinon.stub().rejects(new Error('Unable to retrieve timestamps'))
      });
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
      const objController = new ObjectController(jsonStub);
      await objController.getObjectInfo(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Failed to load data for object'}), 'Error message was incorrect');
    });

    it('should successfully respond info and timestamps', async () => {
      const jsonStub = sinon.createStubInstance(CcdbService, {
        getObjectLatestVersionByPath: sinon.stub().resolves({path: 'qc/some/qc'}),
        getObjectTimestampList: sinon.stub().resolves([1, 2, 3, 4])
      });
      const res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
      const objController = new ObjectController(jsonStub);
      await objController.getObjectInfo({}, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 502');
      assert.ok(res.json.calledWith({info: {path: 'qc/some/qc'}, timestamps: [1, 2, 3, 4]}),
        'Response Object is incorrect');
    });
  });
});
