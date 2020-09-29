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

    it('should throw error due to null ControlProxy dependency', () => {
      assert.throws(() => {
        new ControlService({}, null);
      }, new AssertionError({message: 'Missing ControlProxy dependency', actual: null, expected: true, operator: '=='}));
    });

    it('should successfully instantiate ControlService', () => {
      assert.doesNotThrow(() => new ControlService({}, {}));
    });
  });

  describe('Check helper methods', () => {
    let ctrlService = null;
    before(() => {
      ctrlService = new ControlService({}, {});
    });

    it('should successfully remove `/` from beginning of string', () => {
      assert.strictEqual(ctrlService.parseMethodNameString('/GetRepos'), 'GetRepos');
    });

    it('should successfully return method without changing it', () => {
      assert.strictEqual(ctrlService.parseMethodNameString('GetRepos'), 'GetRepos');
    });

    it('should successfully return same as provided for `null/undefined/<empty_string>`', () => {
      assert.strictEqual(ctrlService.parseMethodNameString(null), null);
      assert.strictEqual(ctrlService.parseMethodNameString(undefined), undefined);
      assert.strictEqual(ctrlService.parseMethodNameString(''), '');
    });

    it('should successfully build version of AliECS Core', () => {
      const versionJSON = {
        productName: 'AliECS',
        versionStr: '0.16.0',
        build: '7d98d22216'
      };
      const version = ctrlService.parseAliEcsVersion(versionJSON);
      assert.strictEqual(version, 'AliECS 0.16.0 (revision 7d98d22216)');
    });

    it('should successfully return empty string if version is not provided', () => {
      const versionJSON = {};
      const version = ctrlService.parseAliEcsVersion(versionJSON);
      assert.strictEqual(version, '');
    });
  });

  describe('Check Connection availability through `ControlProxy`', () => {
    it('should successfully return true when controlProxy states connection is ready', () => {
      const ctrl = new ControlService({}, {connectionReady: true});
      assert.ok(ctrl.isConnectionReady());
    });

    it('should fail due to bad connection and send built error response (503)', () => {
      const ctrl = new ControlService({}, {connectionReady: false});

      const res = {
        status: sinon.fake.returns(),
        send: sinon.fake.returns(true)
      };

      assert.strictEqual(ctrl.isConnectionReady(res), false);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledWith({message: 'Could not establish connection to AliECS Core'}));
    });

    it('should fail due to bad connection and send proxy received error response (503)', () => {
      const ctrl = new ControlService({}, {connectionReady: false, connectionError: {message: 'Could not connect'}});

      const res = {
        status: sinon.fake.returns(),
        send: sinon.fake.returns(true)
      };

      assert.strictEqual(ctrl.isConnectionReady(res), false);
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

  describe('Check executing commands through `ControlProxy`', () => {
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
        connectionReady: true,
        ListRepos: sinon.stub().resolves(['RepoA', 'RepoB'])
      };
      ctrlService = new ControlService({}, ctrlProxy);

      await ctrlService.executeCommand(req, res);
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith(['RepoA', 'RepoB']));
    });
  });

  describe('Check ROC commands execution', () => {
    let ctrlService = null;
    const res = {
      status: sinon.stub().returns(),
      send: sinon.stub()
    };
    it('should send back an error as service is not supported yet', async () => {
      ctrlService = new ControlService({}, {});
      await ctrlService.executeRocCommand(null, res);
      assert.ok(res.status.calledWith(502));
      assert.ok(res.send.calledWith({message: 'ROC-CONFIG - not supported yet'}));
    });
  });

  describe('Check Framework Information', () => {
    it('should reject with general error message if proxy connection is responding', () => {
      const ctrlService = new ControlService({}, {connectionReady: false});
      return assert.rejects(() =>
        ctrlService.getAliECSInfo(), new Error('Could not establish connection to AliECS Core')
      );
    });

    it('should reject with specific error message if proxy connection is not ready', () => {
      const ctrlService = new ControlService(
        {},
        {connectionError: {message: 'Some issue on connection side'}, connectionReady: false}
      );
      return assert.rejects(() => ctrlService.getAliECSInfo(), new Error('Some issue on connection side'));
    });

    it('should reject with specific error message if proxy method is not ready', () => {
      const ctrlService = new ControlService({},
        {connectionReady: true, GetFrameworkInfo: sinon.stub().rejects('Something went wrong')}
      );
      return assert.rejects(() => ctrlService.getAliECSInfo(), new Error('Something went wrong'));
    });

    it('should successfully resolve with AliECS Version', async () => {
      const versionJSON = {
        productName: 'AliECS',
        versionStr: '0.16.0',
        build: '7d98d22216'
      };
      const ctrlService = new ControlService({},
        {connectionReady: true, GetFrameworkInfo: sinon.stub().resolves({version: versionJSON})}
      );
      const response = await ctrlService.getAliECSInfo();
      assert.strictEqual(response.version, 'AliECS 0.16.0 (revision 7d98d22216)');
    });
  });
});
