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

  describe('Check method name is parsed as expected', () => {
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
  });

  describe('Check errors are handled and sent successfully', () => {
    let ctrlService;
    let res;
    before(() => {
      ctrlService = new ControlService({}, {});
    });

    beforeEach(() => {
      res = {
        status: sinon.fake.returns(),
        send: sinon.fake.returns(true)
      };
    });

    it('should successfully respond with built error message when there is a message and no status', () => {
      ctrlService.errorHandler('Error', res);
      assert.ok(res.status.calledOnce);
    });

    it('should successfully respond with built error message and status > 500', () => {
      ctrlService.errorHandler('Error', res, 502);
      assert.ok(res.status.calledWith(502));
    });

    it('should successfully respond with built error message and status < 500', () => {
      ctrlService.errorHandler('Error', res, 404);
      assert.ok(res.status.calledWith(404));
    });


    it('should successfully respond with built error.message and status', () => {
      const err = {
        message: 'Test Error',
        stack: 'Some Stack'
      };
      ctrlService.errorHandler(err, res, 502);
      assert.ok(res.status.calledWith(502));
      assert.ok(res.send.calledWith({message: 'Test Error'}));
    });

    it('should successfully respond with built error.message, no stack and status', () => {
      const err = 'Test Error';
      ctrlService.errorHandler(err, res, 404);
      assert.ok(res.status.calledWith(404));
      assert.ok(res.send.calledWith({message: 'Test Error'}));
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
      assert.ok(res.send.calledWith({message: 'Could not establish gRPC connection to Control-Core'}));
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
});
