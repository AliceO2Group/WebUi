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

const LayoutConnector = require('./../../lib/connector/LayoutConnector.js');
const JsonFileConnector = require('./../../lib/JsonFileConnector.js');

describe('Layout connector test suite', () => {
  describe('Creating a new LayoutConnector instance', () => {
    it('should throw an error if it is missing JSONFileConnector ', () => {
      assert.throws(() => new LayoutConnector(undefined),
        new AssertionError({message: '[LayoutConnector] Missing JSON File Connector', expected: true, operator: '=='}));
      assert.throws(() => new LayoutConnector(undefined),
        new AssertionError({message: '[LayoutConnector] Missing JSON File Connector', expected: true, operator: '=='}));
    });

    it('should successfully initialize LayoutConnector', () => {
      assert.doesNotThrow(() => new LayoutConnector({}));
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
      const layoutConnector = new LayoutConnector(jsonStub);
      await layoutConnector.listLayouts(req, res);
      assert.ok(res.status.calledWith(500), 'Response status was not 500');
      assert.ok(res.send.calledWith({message: 'Unable to connect'}), 'Error message was incorrect');
    });

    it('should successfully return a list of layouts', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        listLayouts: sinon.stub().resolves([{name: 'somelayout'}])
      });
      const req = {body: {}};
      const layoutConnector = new LayoutConnector(jsonStub);
      await layoutConnector.listLayouts(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith([{name: 'somelayout'}]), 'A list of layouts should have been sent back');
    });

    it('should successfully return a list of layouts based on owner_id', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        listLayouts: sinon.stub().resolves([{name: 'somelayout'}])
      });
      const req = {body: {owner_id: '1'}};
      const layoutConnector = new LayoutConnector(jsonStub);
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
      const req = {body: {}};
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layoutId parameter is needed'}), 'Error message was incorrect');
    });

    it('should successfully return a layout specified by its id', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        readLayout: sinon.stub().resolves([{layout: 'somelayout'}])
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {body: {layoutId: 'mylayout'}};
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith([{layout: 'somelayout'}]), 'A JSON defining a layout should have been sent back');
      assert.ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });

    it('should successfully return an empty object if data connector returned nothing', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        readLayout: sinon.stub().resolves()
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {body: {layoutId: 'mylayout'}};
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(404), 'Response status was not 404');
      assert.ok(res.json.calledWith(), 'Undefined should be sent back');
      assert.ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });

    it('should return error if data connector failed', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        readLayout: sinon.stub().rejects(new Error('Unable to read layout'))
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {body: {layoutId: 'mylayout'}};
      await layoutConnector.readLayout(req, res);
      assert.ok(res.status.calledWith(500), 'Response status was not 500');
      assert.ok(res.send.calledWith({message: 'Unable to read layout'}), 'Error message was incorrect');
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
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layoutId parameter is needed'}), 'Error message was incorrect');
    });

    it('should respond with 400 error if request did not contain body id', async () => {
      const req = {query: {layoutId: 'someid'}};
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'body for the updated layout is needed'}), 'Error message was incorrect');
    });

    it('should successfully return the id of the updated layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        updateLayout: sinon.stub().resolves([{id: 'somelayout'}])
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {query: {layoutId: 'mylayout'}, body: {}};
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith([{id: 'somelayout'}]), 'A layout id should have been sent back');
      assert.ok(jsonStub.updateLayout.calledWith('mylayout', {}), 'Layout id was not used in data connector call');
    });

    it('should return error if data connector failed to update', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        updateLayout: sinon.stub().rejects(new Error('Could not update layout'))
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {query: {layoutId: 'mylayout'}, body: {}};
      await layoutConnector.updateLayout(req, res);
      assert.ok(res.status.calledWith(500), 'Response status was not 500');
      assert.ok(res.send.calledWith({message: 'Could not update layout'}), 'DataConnector error message is incorrect');
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
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.deleteLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layoutId is needed'}), 'Error message was incorrect');
    });

    it('should successfully return the id of the deleted layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        deleteLayout: sinon.stub().resolves({id: 'somelayout'})
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {params: {layoutId: 'somelayout'}};
      await layoutConnector.deleteLayout(req, res);
      assert.ok(res.status.calledWith(204), 'Response status was not 204');
      assert.ok(res.json.calledWith({id: 'somelayout'}), 'A layout id should have been sent back');
      assert.ok(jsonStub.deleteLayout.calledWith('somelayout'), 'Layout id was not used in data connector call');
    });

    it('should return error if data connector failed to update', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        deleteLayout: sinon.stub().rejects(new Error('Could not delete layout'))
      });
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {params: {layoutId: 'mylayout'}};
      await layoutConnector.deleteLayout(req, res);
      assert.ok(res.status.calledWith(500), 'Response status was not 500');
      assert.ok(res.send.calledWith({message: 'Could not delete layout'}), 'DataConnector error message is incorrect');
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
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layout.name parameter is needed'}), 'Error message was incorrect');
    });
    it('should respond with 400 error if request did not contain layout name when requesting to update', async () => {
      const req = {body: {name: 'somelayout'}};
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layout.owner_id parameter is needed'}), 'Error message was incorrect');
    });
    it('should respond with 400 error if request did not contain owner name when requesting to update', async () => {
      const req = {body: {name: 'somelayout', owner_id: 1}};
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layout.owner_name parameter is needed'}), 'Error message was incorrect');
    });
    it('should respond with 400 error if request did not contain tabs when requesting to update', async () => {
      const req = {body: {name: 'somelayout', owner_id: 1, owner_name: 'admin'}};
      const layoutConnector = new LayoutConnector({});
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(400), 'Response status was not 400');
      assert.ok(res.send.calledWith({message: 'layout.tabs parameter is needed'}), 'Error message was incorrect');
    });

    it('should successfully return created layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileConnector, {
        createLayout: sinon.stub().resolves({layout: 'somelayout'})
      });
      const layoutConnector = new LayoutConnector(jsonStub);
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
      const layoutConnector = new LayoutConnector(jsonStub);
      const req = {body: {name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: []}};
      await layoutConnector.createLayout(req, res);
      assert.ok(res.status.calledWith(409), 'Response status was not 409');
      assert.ok(res.send.calledWith({message: 'Could not create layout'}), 'DataConnector error message is incorrect');
      assert.ok(jsonStub.createLayout.calledWith(req.body), 'New layout body was not used in data connector call');
    });
  });
});
