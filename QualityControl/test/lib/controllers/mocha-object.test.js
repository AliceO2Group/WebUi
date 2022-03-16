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
      const objController = new ObjectController(jsonStub);
      await objController.getObjectInfo({}, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 502');
      assert.ok(res.json.calledWith({info: {path: 'qc/some/qc'}, timestamps: [1, 2, 3, 4]}),
        'Response Object is incorrect');
    });
  });

  describe('`getObjectContent()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });

    it('should respond with error if db service cannot provide location', async () => {
      const dbService = sinon.createStubInstance(CcdbService, {
        getRootObjectLocation: sinon.stub().rejects(new Error('Failed to load data for object'))
      });
      const objController = new ObjectController(dbService, {});
      await objController.getObjectContent({query: {}}, res);

      assert.ok(res.status.calledWith(502), 'Request was not called with 502 status');
      assert.ok(res.send.calledWith({message: 'Unable to read ROOT file'}), 'Error message was incorrect');
    });

    it('should respond with error if JSROOT fails to open file', async () => {
      const dbService = sinon.createStubInstance(CcdbService, {
        getRootObjectLocation: sinon.stub().resolves('/download/123456')
      });
      const rootMock = {
        openFile: sinon.stub().rejects('Unable to open file'),
      };
      const objController = new ObjectController(dbService, rootMock);

      await objController.getObjectContent({query: {path: '1234'}}, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Unable to read ROOT file'}), 'Error message was incorrect');
    });

    it('should respond with error if JSROOT fails to read object in file', async () => {
      const dbService = sinon.createStubInstance(CcdbService, {
        getRootObjectLocation: sinon.stub().resolves('/download/123456')
      });
      const fileMock = {readObject: sinon.stub().rejects('Unable')};
      const rootMock = {openFile: sinon.stub().resolves(fileMock)};
      const objController = new ObjectController(dbService, rootMock);

      await objController.getObjectContent({query: {path: 'some/qc'}}, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Unable to read ROOT file'}), 'Error message was incorrect');
    });

    it('should respond with error if JSROOT fails convert content to JSON', async () => {
      const dbService = sinon.createStubInstance(CcdbService, {
        getRootObjectLocation: sinon.stub().resolves('/download/123456')
      });
      const fileMock = {readObject: sinon.stub().resolves({})};
      const rootMock = {
        openFile: sinon.stub().resolves(fileMock),
        toJSON: sinon.stub().rejects('Unable')
      };
      const objController = new ObjectController(dbService, rootMock);

      await objController.getObjectContent({query: {path: 'some/qc'}}, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Unable to read ROOT file'}), 'Error message was incorrect');
    });

    it('should successfully reply with a JSON respond object', async () => {
      const dbService = sinon.createStubInstance(CcdbService, {
        getRootObjectLocation: sinon.stub().resolves('/download/123456')
      });
      const fileMock = {readObject: sinon.stub().resolves({})};
      const rootMock = {
        openFile: sinon.stub().resolves(fileMock),
        toJSON: sinon.stub().resolves({__type: 'THistogram'})
      };
      const objController = new ObjectController(dbService, rootMock);

      await objController.getObjectContent({query: {path: 'some/qc'}}, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith({__type: 'THistogram'}), 'Expected JSON Object is different');
    });
  });
});
