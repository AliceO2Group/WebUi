import { strictEqual } from 'node:assert';
import { suite, test } from 'node:test';
import sinon from 'sinon';
import { getLayoutsMiddleware } from '../../../../lib/middleware/layouts/layoutsGet.middleware.js';

export const getLayoutsMiddlewareTestSuite = async () => {
  suite('getLayoutsMiddleware Test Suite', () => {
    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();
    const invalidInputErrorJson = (message) => ({
      message: `Invalid query parameters: ${message}`,
      status: 400,
      title: 'Invalid Input',
    });
    test('should throw if token is not provided', async () => {
      req.query = { invalid: 'query' };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(res.json.calledWith(invalidInputErrorJson('"token" is required')), true);
    });
    //if ownner_id is not a number
    test('should throw if owner_id is not a number', async () => {
      req.query = { token: 'validToken', owner_id: 'notANumber' };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(res.json.calledWith(invalidInputErrorJson('"owner_id" must be a number')), true);
    });
    //if name is not a string
    test('should throw if name is not a string', async () => {
      req.query = { token: 'validToken', name: 12345 };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(res.json.calledWith(invalidInputErrorJson('"name" must be a string')), true);
    });
    //if filter is not an object
    test('should throw if filter is not an object', async () => {
      req.query = { token: 'validToken', filter: 'notAnObject' };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(res.json.calledWith(invalidInputErrorJson('"filter" must be of type object')), true);
    });
    test('should throw if filter.objectPath does not follow the pattern', async () => {
      req.query = { token: 'validToken', filter: { objectPath: 'invalid path!' } };
      await getLayoutsMiddleware(req, res, next);
      const message =
        '"ObjectPath" with value "invalid path!" fails to match the required pattern: /^[A-Za-z0-9_\\-/]+$/';
      strictEqual(res.json.calledWith(invalidInputErrorJson(message)), true);
    });
    test('should throw if fields is not a string', async () => {
      req.query = { token: 'validToken', fields: 12345 };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(res.json.calledWith(invalidInputErrorJson('"fields" must be a string')), true);
    });
    test('should throw if fields contains an invalid field', async () => {
      req.query = { token: 'validToken', fields: 'id,name,invalidField' };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(res.json.calledWith(invalidInputErrorJson('"fields" contains invalid field: invalidField')), true);
    });
    test('should pass if only token is provided', async () => {
      req.query = { token: 'validToken' };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(next.called, true);
    });
    test('should pass if all parameters are valid', async () => {
      req.query = {
        token: 'validToken',
        owner_id: 123,
        name: 'validName',
        filter: { objectPath: 'valid/path' },
        fields: 'id,name,owner_id',
      };
      await getLayoutsMiddleware(req, res, next);
      strictEqual(next.called, true);
    });
  });
};
