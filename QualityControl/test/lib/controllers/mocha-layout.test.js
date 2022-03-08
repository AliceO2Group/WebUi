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

const {LayoutController} = require('../../../lib/controllers');
const JsonFileConnector = require('../../../lib/JsonFileConnector.js');

describe('LayoutController test suite', () => {
  describe('Creating a new LayoutController instance', () => {
    it('should throw an error if it is missing service for retrieving data', () => {
      assert.throws(() => new LayoutController(undefined),
        new AssertionError({message: 'Missing service for retrieving layout data', expected: true, operator: '=='}));
      assert.throws(() => new LayoutController(undefined),
        new AssertionError({message: 'Missing service for retrieving layout data', expected: true, operator: '=='}));
    });

    it('should successfully initialize LayoutController', () => {
      assert.doesNotThrow(() => new LayoutController({}));
    });
  });

  describe('`listLayouts()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });
    it('should respond with error if data connector could not find layouts', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        listLayouts: sinon.stub().rejects(new Error('Unable to connect'))
      });
      const req = {body: {}};
      const res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.listLayouts(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Failed to retrieve layouts'}), 'Error message was incorrect');
    });

    it('should successfully return a list of layouts', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        listLayouts: sinon.stub().resolves([{name: 'somelayout'}])
      });
      const req = {query: {}};
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.listLayouts(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith([{name: 'somelayout'}]), 'A list of layouts should have been sent back');
    });

    it('should successfully return a list of layouts based on owner_id', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        listLayouts: sinon.stub().resolves([{name: 'somelayout'}])
      });
      const req = {query: {owner_id: '1'}};
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.listLayouts(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith([{name: 'somelayout'}]), 'A list of layouts should have been sent back');
      assert.ok(jsonStub.listLayouts.calledWith({owner_id: 1}), 'Owner id was not used in data connector call');
    });
  });

  describe('`readLayout()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });
    it('should respond with 400 error if request did not contain layout id when requesting to read', async () => {
      const req = {params: {}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layoutId parameter'}), 'Error message was incorrect');
    });

    it('should successfully return a layout specified by its id', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        readLayout: sinon.stub().resolves([{layout: 'somelayout'}])
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {params: {id: 'mylayout'}};
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith([{layout: 'somelayout'}]), 'A JSON defining a layout should have been sent back');
      assert.ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });

    it('should return error if data connector failed', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        readLayout: sinon.stub().rejects(new Error('Unable to read layout'))
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {params: {id: 'mylayout'}};
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Failed to retrieve layout'}), 'Error message was incorrect');
      assert.ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });
  });

  describe('`updateLayout()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });

    it('should respond with 400 error if request did not contain layout id when requesting to update', async () => {
      const req = {query: {}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layoutId parameter'}), 'Error message was incorrect');
    });

    it('should respond with 400 error if request did not contain body id', async () => {
      const req = {query: {layoutId: 'someid'}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing body content parameter'}), 'Error message was incorrect');
    });

    it('should successfully return the id of the updated layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        updateLayout: sinon.stub().resolves([{id: 'somelayout'}])
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {query: {layoutId: 'mylayout'}, body: {}};
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(201), 'Response status was not 200');
      assert.ok(res.json.calledWith([{id: 'somelayout'}]), 'A layout id should have been sent back');
      assert.ok(jsonStub.updateLayout.calledWith('mylayout', {}), 'Layout id was not used in data connector call');
    });

    it('should return error if data connector failed to update', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        updateLayout: sinon.stub().rejects(new Error('Could not update layout'))
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {query: {layoutId: 'mylayout'}, body: {}};
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Failed to update layout'}), 'DataConnector error message is incorrect');
      assert.ok(jsonStub.updateLayout.calledWith('mylayout', {}), 'Layout id was not used in data connector call');
    });
  });

  describe('`deleteLayout()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });

    it('should respond with 400 error if request did not contain layout id when requesting to update', async () => {
      const req = {params: {}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.deleteLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layoutId parameter'}), 'Error message was incorrect');
    });

    it('should successfully return the id of the deleted layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        deleteLayout: sinon.stub().resolves({id: 'somelayout'})
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {params: {id: 'somelayout'}};
      await layoutConnector.deleteLayout(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith({id: 'somelayout'}), 'A layout id should have been sent back');
      assert.ok(jsonStub.deleteLayout.calledWith('somelayout'), 'Layout id was not used in data connector call');
    });

    it('should return error if data connector failed to update', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        deleteLayout: sinon.stub().rejects(new Error('Could not delete layout'))
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {params: {id: 'mylayout'}};
      await layoutConnector.deleteLayout(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 502');
      assert.ok(res.send.calledWith({message: 'Failed to delete layout'}), 'DataConnector error message is incorrect');
      assert.ok(jsonStub.deleteLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });
  });

  describe('`createLayout()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
        json: sinon.stub()
      };
    });

    it('should respond with 400 error if request did not contain owner_id when requesting to update', async () => {
      const req = {body: {}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layout.name parameter'}), 'Error message was incorrect');
    });
    it('should respond with 400 error if request did not contain layout name when requesting to update', async () => {
      const req = {body: {name: 'somelayout'}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layout.owner_id parameter'}), 'Error message was incorrect');
    });
    it('should respond with 400 error if request did not contain owner name when requesting to update', async () => {
      const req = {body: {name: 'somelayout', owner_id: 1}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layout.owner_name parameter'}), 'Error message was incorrect');
    });
    it('should respond with 400 error if request did not contain tabs when requesting to update', async () => {
      const req = {body: {name: 'somelayout', owner_id: 1, owner_name: 'admin'}};
      const layoutConnector = new LayoutController({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'Missing layout.tabs parameter'}), 'Error message was incorrect');
    });

    it('should successfully return created layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        createLayout: sinon.stub().resolves({layout: 'somelayout'})
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {body: {name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: []}};
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(201), 'Response status was not 201');
      assert.ok(res.json.calledWith({layout: 'somelayout'}), 'A layout should have been sent back');
      assert.ok(jsonStub.createLayout.calledWith(req.body), 'New layout body was not used in data connector call');
    });

    it('should return error if data connector failed to update', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        createLayout: sinon.stub().rejects(new Error('Could not create layout'))
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = {body: {name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: []}};
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(409), 'Response status was not 409');
      assert.ok(res.send.calledWith({message: 'Failed to create layout'}), 'DataConnector error message is incorrect');
      assert.ok(jsonStub.createLayout.calledWith(req.body), 'New layout body was not used in data connector call');
    });
  });
});
