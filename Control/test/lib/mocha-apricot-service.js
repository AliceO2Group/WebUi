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

const sinon = require('sinon');
const assert = require('assert');
const AssertionError = require('assert').AssertionError;

const ApricotService = require('./../../lib/control-core/ApricotService.js');

describe('ApricotService test suite', () => {
  describe('Check Constructor', () => {
    it('should throw error due to null ApricotProxy dependency', () => {
      assert.throws(() => {
        new ApricotService(null);
      }, new AssertionError({message: 'Missing GrpcProxy dependency for Apricot', actual: null, expected: true, operator: '=='}));
    });

    it('should successfully instantiate ApricotService', () => {
      assert.doesNotThrow(() => new ApricotService({}));
    });
  });

  describe('Check executing commands through `GrpcProxy`', () => {
    let apricotService;
    let req, res;
    beforeEach(() => {
      apricotService = null;
      req = {
        session: {
          personid: 0
        },
        path: 'ListDetectors',
        body: {value: 'Test'}
      };
      res = {
        json: sinon.fake.returns(),
        status: sinon.fake.returns(),
        send: sinon.fake.returns()
      };
    });

    it('should successfully execute command, send response with status and message', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().resolves(['TPC', 'TPA'])
      };
      apricotService = new ApricotService(apricotProxy);

      await apricotService.executeCommand(req, res);
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith(['TPC', 'TPA']));
    });

    it('should attempt execute command but send response with error if connection is not ready and no connection error is provided', async () => {
      const apricotProxy = {isConnectionReady: false};
      apricotService = new ApricotService(apricotProxy);

      await apricotService.executeCommand(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Could not establish connection to AliECS Core due to pontentially undefined method'}));
    });

    it('should attempt execute command but send response with error if connection is not ready and connection error is provided', async () => {
      const apricotProxy = {isConnectionReady: false, connectionError: {message: 'Something went wrong'}};
      apricotService = new ApricotService(apricotProxy);

      await apricotService.executeCommand(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Something went wrong'}));
    });

    it('should attempt execute command but send response with error if method was not provided', async () => {
      const apricotProxy = {isConnectionReady: true};
      apricotService = new ApricotService(apricotProxy);
      req = {
        session: {
          personid: 0
        }, // missing path
        body: {value: 'Test'}
      };
      await apricotService.executeCommand(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Could not establish connection to AliECS Core due to pontentially undefined method'}));
    });
  });
});
