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
/* eslint-disable require-jsdoc */

const ControlService = require('./../../lib/control-core/ControlService.js');
const RequestHandler = require('./../../lib/control-core/RequestHandler.js');
const sinon = require('sinon');
const assert = require('assert');

describe('Request Handler of Control Service test suite', () => {
  describe('Test request store', () => {
    const res = {
      json: sinon.fake.returns(true),
      status: sinon.fake.returns(),
      send: sinon.fake.returns(true)
    };

    const req = {
      body: {
        detectors: 'TPC',
        workflowTemplate: 'readout',
      },
      session: {
        name: 'test'
      },
      params: {
        id: 0
      }
    };
    
    it('Add request to store', async() => {
      const ctrlProxy = {
        isConnectionReady: true,
        NewEnvironment: sinon.stub().rejects()
      };
      const ctrl = new ControlService(ctrlProxy);
      const handler = new RequestHandler(ctrl);
      handler.add(req, res);
      const storedRequest = handler.requestList[0];
      assert.strictEqual(Object.keys(handler.requestList).length, 1);
      assert.strictEqual(storedRequest.detectors, 'TPC');
      assert.strictEqual(storedRequest.workflow, 'readout');
    });

    it('Add request and remove it as control promise rejects', async() => {
      const ctrlProxy = {
        isConnectionReady: true,
        NewEnvironment: sinon.stub().rejects()
      };
      const ctrl = new ControlService(ctrlProxy);
      const handler = new RequestHandler(ctrl);
      assert.rejects(async() => await handler.add(req, res));
    });

    it('Add request and remove it, check empty list', async() => {
      const ctrlProxy = {
        isConnectionReady: true,
        NewEnvironment: sinon.stub().rejects()
      };
      const ctrl = new ControlService(ctrlProxy);
      const handler = new RequestHandler(ctrl);
      await handler.add(req, res);
      await handler.remove(req, res);
      assert.strictEqual(Object.keys(handler.requestList).length, 0);
    });

    it('Add request to the store', async() => {
      const ctrlProxy = {
        isConnectionReady: true,
        NewEnvironment: sinon.stub().resolves({})
      };
      const ctrl = new ControlService(ctrlProxy);
      const handler = new RequestHandler(ctrl);
      handler.add(req, res);
      assert.strictEqual(Object.keys(handler.requestList).length, 1);
      await Promise.resolve();
      assert.strictEqual(Object.keys(handler.requestList).length, 0); 
    });
  });
});
