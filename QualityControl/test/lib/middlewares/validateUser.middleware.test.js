import { ok, strictEqual } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import sinon from 'sinon';
import { validateUserSession } from '../../../lib/middleware/validateUser.middleware.js';

export const validateUserMiddlewareTestSuite = async () => {
  let req = null;
  let res = null;
  let next = null;
  beforeEach(() => {
    req = { session: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
    next = sinon.stub();
  });
  suite('validateUserSession Middleware Test Suite', () => {
    test('should throw if session is not an object', async () => {
      req.session = 'notAnObject';
      await validateUserSession(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid user: "value" must be of type object',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if personid is not provided', async () => {
      req.session = { username: 'validUsername', name: 'validName' };
      await validateUserSession(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid user: id of the user is mandatory',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if personid is not a number', async () => {
      req.session = { personid: 'notANumber', username: 'validUsername', name: 'validName' };
      await validateUserSession(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid user: id of the user must be a number',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if username is not provided', async () => {
      req.session = { personid: 1, name: 'validName' };
      await validateUserSession(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid user: username of the user is mandatory',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if name is not provided', async () => {
      req.session = { personid: 1, username: 'validUsername' };
      await validateUserSession(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid user: name of the user is mandatory',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should pass if all required fields are provided and valid', async () => {
      req.session = { personid: 1, username: 'validUsername', name: 'validName' };
      await validateUserSession(req, res, next);
      strictEqual(next.called, true);
    });
  });
};
