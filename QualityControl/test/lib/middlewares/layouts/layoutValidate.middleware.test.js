import { ok, strictEqual } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import sinon from 'sinon';
import {
  validateCreateLayoutMiddleware,
  validateUpdateLayoutMiddleware,
  validatePatchLayoutMiddleware,
} from '../../../../lib/middleware/layouts/layoutValidate.middleware.js';

export const layoutValidateMiddlewareTestSuite = async () => {
  let req = null;
  let res = null;
  let next = null;
  let mockValidLayout = null;
  beforeEach(() => {
    req = { body: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
    next = sinon.stub();
    mockValidLayout = {
      id: 'validId',
      name: 'validName',
      owner_id: 1,
      owner_name: 'validOwner',
      tabs: [
        {
          id: 'tab1',
          name: 'Tab 1',
        },
      ],
    };
  });
  suite('LayoutDTO validations', () => {
    //id name tabs and owner_id, owner_name are required
    test('should throw if id is not provided', async () => {
      delete mockValidLayout.id;
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "id" is required',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if name is not provided', async () => {
      delete mockValidLayout.name;
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "name" is required',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if tabs is not provided', async () => {
      delete mockValidLayout.tabs;
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "tabs" is required',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if tabs is empty', async () => {
      mockValidLayout.tabs = [];
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "tabs" must contain at least 1 items',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if owner_id is not provided', async () => {
      delete mockValidLayout.owner_id;
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "owner_id" is required',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if owner_name is not provided', async () => {
      delete mockValidLayout.owner_name;
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "owner_name" is required',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if owner_name is not a string', async () => {
      mockValidLayout.owner_name = 12345;
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "owner_name" must be a string',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if description is too long', async () => {
      mockValidLayout.description = 'a'.repeat(101);
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "description" length must be less than or equal to 100 characters long',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if collaborators is not an array', async () => {
      mockValidLayout.collaborators = 'notAnArray';
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "collaborators" must be an array',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    //displayTimestamp is not a boolean
    test('should throw if displayTimestamp is not a boolean', async () => {
      mockValidLayout.displayTimestamp = 'notABoolean';
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "displayTimestamp" must be a boolean',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if autoTabChange is not a number', async () => {
      mockValidLayout.autoTabChange = 'notANumber';
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "autoTabChange" must be a number',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    //invalid property in layout object
    test('should throw if layout contains an invalid property', async () => {
      mockValidLayout.invalidProperty = 'invalid';
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "invalidProperty" is not allowed',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    //invalid property in tab object
    test('should throw if a tab contains an invalid property', async () => {
      mockValidLayout.tabs[0].invalidProperty = 'invalid';
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for create: "tabs[0].invalidProperty" is not allowed',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    //valid layout
    test('should pass if layout is valid', async () => {
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(next.called, true);
    });
  });
  suite('LayoutPatchDTO validations', () => {
    test('should throw if layout is not an object', async () => {
      req.body = 'notAnObject';
      await validatePatchLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for patch: "value" must be of type object',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should throw if isOfficial is not a boolean', async () => {
      req.body = { isOfficial: 'notABoolean' };
      await validatePatchLayoutMiddleware(req, res, next);
      strictEqual(res.json.called, true);
      ok(res.json.calledWith({
        message: 'Invalid body for patch: "isOfficial" must be a boolean',
        status: 400,
        title: 'Invalid Input',
      }));
    });
  });

  suite('validate layout create middleware test suite', () => {
    test('should call next if layout is valid', async () => {
      req.body = { ...mockValidLayout };
      await validateCreateLayoutMiddleware(req, res, next);
      strictEqual(next.called, true, 'next should be called');
    });
  });
  suite('validate layout update middleware test suite', () => {
    test('should call next if layout is valid', async () => {
      req.body = { ...mockValidLayout };
      await validateUpdateLayoutMiddleware(req, res, next);
      strictEqual(next.called, true, 'next should be called');
    });
  });

  suite('validate layout patch middleware test suite', () => {
    test('should call next if layout is valid', async () => {
      req.body = { isOfficial: true };
      await validatePatchLayoutMiddleware(req, res, next);
      strictEqual(next.called, true, 'next should be called');
    });
  });
};
