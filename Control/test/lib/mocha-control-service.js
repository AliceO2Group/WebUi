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

/* eslint-disable max-len */

const ControlService = require('./../../lib/control-core/ControlService.js');
const sinon = require('sinon');
const assert = require('assert');
const AssertionError = require('assert').AssertionError;

describe('Control Service test suite', () => {
  describe('Check Constructor', () => {
    it('should throw error due to missing PadLock dependency', () => {
      assert.throws(() => {
        new ControlService();
      }, new AssertionError({message: 'Missing PadLock dependency', expected: true, operator: '=='}));
    });

    it('should throw error due to null GrpcProxy dependency', () => {
      assert.throws(() => {
        new ControlService({}, null);
      }, new AssertionError({message: 'Missing GrpcProxy dependency for AliECS', actual: null, expected: true, operator: '=='}));
    });

    it('should successfully instantiate ControlService', () => {
      assert.doesNotThrow(() => new ControlService({}, {}));
    });
  });

  describe('Check Connection availability through `GrpcProxy`', () => {
    it('should successfully return true when controlProxy states connection is ready', () => {
      const ctrl = new ControlService({}, {isConnectionReady: true});
      assert.ok(ctrl.isConnectionReady());
    });

    it('should fail due to bad connection and send built error response (503)', () => {
      const ctrl = new ControlService({}, {isConnectionReady: false});

      const res = {
        status: sinon.fake.returns(),
        send: sinon.fake.returns(true)
      };

      ctrl.isConnectionReady(null, res, null);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledWith({message: 'Could not establish connection to AliECS Core'}));
    });

    it('should fail due to bad connection and send proxy received error response (503)', () => {
      const ctrl = new ControlService({}, {isConnectionReady: false, connectionError: {message: 'Could not connect'}});

      const res = {
        status: sinon.fake.returns(),
        send: sinon.fake.returns(true)
      };

      ctrl.isConnectionReady(null, res, null);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledWith({message: 'Could not connect'}));
    });
  });

  describe('Check PadLock availability', () => {
    let ctrlService;
    let res;

    beforeEach(() => {
      ctrlService = new ControlService({}, {});

      res = {
        status: sinon.fake.returns(),
        send: sinon.fake.returns(true)
      };
    });

    it('should successfully return true for methods starting with `Get`', () => {
      assert.ok(ctrlService.isLockSetUp('GetRepos'));
    });

    it('should successfully return true for `ListRepos`', () => {
      assert.ok(ctrlService.isLockSetUp('ListRepos'));
    });

    it('should successfully return true for other methods when user already owns lock', () => {
      ctrlService = new ControlService({lockedBy: 11}, {});
      assert.ok(ctrlService.isLockSetUp('NewEnvironment', {session: {personid: 11}}, null));
    });

    it('should send errors in response when lock was not acquired', () => {
      assert.strictEqual(ctrlService.isLockSetUp('NewEnvironment', {}, res), false);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.send.calledWith({message: 'Control is not locked'}));
    });

    it('should send errors in response when other user is already owning the lock', () => {
      ctrlService = new ControlService({lockedBy: 11, lockedByName: 'admin'}, {});
      assert.strictEqual(ctrlService.isLockSetUp('NewEnvironment', {session: {personid: 22}}, res), false);
      assert.ok(res.status.calledWith(403));
      assert.ok(res.send.calledWith({message: 'Control is locked by admin'}));
    });
  });

  describe('Check executing commands through `GrpcProxy`', () => {
    let ctrlService = null;
    const req = {
      session: {
        personid: 0
      },
      path: 'ListRepos',
      body: 'Test'
    };

    const res = {
      json: sinon.fake.returns(),
      status: sinon.stub().returns(),
      send: sinon.stub()
    };

    it('should successfully execute command, send response with status and message', async () => {
      const ctrlProxy = {
        isConnectionReady: true,
        ListRepos: sinon.stub().resolves(['RepoA', 'RepoB'])
      };
      ctrlService = new ControlService({}, ctrlProxy);

      await ctrlService.executeCommand(req, res);
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith(['RepoA', 'RepoB']));
    });
  });

  describe('Check Framework Information', () => {
    it('should reject with general error message if proxy connection is responding', () => {
      const ctrlService = new ControlService({}, {isConnectionReady: false});
      return assert.rejects(() =>
        ctrlService.getAliECSInfo(), new Error('Could not establish connection to AliECS Core')
      );
    });

    it('should reject with specific error message if proxy connection is not ready', () => {
      const ctrlService = new ControlService(
        {},
        {connectionError: {message: 'Some issue on connection side'}, isConnectionReady: false}
      );
      return assert.rejects(() => ctrlService.getAliECSInfo(), new Error('Some issue on connection side'));
    });

    it('should reject with specific error message if proxy method is not ready', () => {
      const ctrlService = new ControlService({},
        {isConnectionReady: true, GetFrameworkInfo: sinon.stub().rejects('Something went wrong')}
      );
      return assert.rejects(() => ctrlService.getAliECSInfo(), 'Something went wrong');
    });

    it('should successfully resolve with AliECS Version', async () => {
      const versionJSON = {
        productName: 'AliECS',
        versionStr: '0.16.0',
        build: '7d98d22216'
      };
      const ctrlService = new ControlService({},
        {isConnectionReady: true, GetFrameworkInfo: sinon.stub().resolves({version: versionJSON})}
      );
      const response = await ctrlService.getAliECSInfo();
      assert.strictEqual(response.version, 'AliECS 0.16.0 (revision 7d98d22216)');
    });
  });

  describe('Test GetIntegratedServices call', () => {
    it('should successfully reject due to no control proxy setup', () => {
      const ctrlService = new ControlService({}, {});
      return assert.rejects(() =>
        ctrlService.getIntegratedServicesInfo(), new Error('Could not establish connection to AliECS Core')
      );
    });

    it('should successfully reject due to no control proxy missing connection', () => {
      const ctrlService = new ControlService({}, {isConnectionReady: false});
      return assert.rejects(() =>
        ctrlService.getIntegratedServicesInfo(), new Error('Could not establish connection to AliECS Core')
      );
    });

    it('should reject with specific error message if proxy method is not ready', () => {
      const ctrlService = new ControlService({},
        {isConnectionReady: true, GetIntegratedServices: sinon.stub().rejects('Something went wrong')}
      );
      return assert.rejects(() => ctrlService.getIntegratedServicesInfo(), 'Something went wrong');
    });

    it('should successfully resolve with AliECS integrated services map', async () => {
      const services = {
        dcs: {},
        someOtherDcs: {},
      };
      const ctrlService = new ControlService({},
        {
          isConnectionReady: true,
          GetIntegratedServices: sinon.stub().resolves({
            dcs: {},
            someOtherDcs: {},
          })
        }
      );
      const response = await ctrlService.getIntegratedServicesInfo();
      assert.deepStrictEqual(response, services);
    });
  });
});
