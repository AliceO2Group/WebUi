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

import { ok, throws, strictEqual } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import sinon from 'sinon';

import { LayoutController } from './../../../lib/controllers/LayoutController.js';
import { LAYOUT_ADAPTED_MOCK, LAYOUT_INPUT_MOCK } from '../../demoData/layout/layout.mock.js';
import { LayoutAdapter } from '../../../lib/controllers/adapters/layout-adapter.js';

export const layoutControllerTestSuite = async () => {
  suite('Creating a new LayoutController instance', () => {
    test('should throw an error if it is missing service for retrieving data', () => {
      throws(
        () => new LayoutController(),
        {
          name: 'AssertionError',
          message: 'Missing layout service',
        },
      );
    });

    test('should successfully initialize LayoutController', () => {
      const fakeService = {};
      const controller = new LayoutController(fakeService);

      ok(controller instanceof LayoutController);
      ok(controller._layoutService === fakeService);
    });
  });

  suite('getLayoutsHandler()', () => {
    let layoutServiceMock = null;
    let controller = null;
    let req = null;
    let res = null;

    beforeEach(() => {
      layoutServiceMock = {
        getAllLayouts: sinon.stub(),
        getLayoutsByOwnerId: sinon.stub(),
      };
      controller = new LayoutController(layoutServiceMock);

      req = { query: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with error if layout repository could not find layouts', async () => {
      layoutServiceMock.getAllLayouts.rejects(new Error('DB failure'));

      await controller.getLayoutsHandler(req, res);

      strictEqual(res.status.calledOnceWith(500), true);
      ok(res.json.calledOnce);
      ok(res.json, {
        message: 'Unable to retrieve layouts',
        status: 500,
        title: 'Unknown Error',
      });
    });

    test('should successfully return a list of layouts', async () => {
      const fakeLayouts = [LAYOUT_INPUT_MOCK];
      layoutServiceMock.getAllLayouts.resolves(fakeLayouts);

      const adaptStub = sinon.stub(LayoutAdapter, 'adaptLayoutForExpressAPI').callsFake((layout) => layout);

      await controller.getLayoutsHandler(req, res);

      strictEqual(res.status.calledOnceWith(200), true);
      ok(res.json, LAYOUT_ADAPTED_MOCK);

      adaptStub.restore();
    });

    test('should successfully return a list of layouts based on owner_id', async () => {
      const fakeOwnerId = 42;
      const layoutsByOwner = [LAYOUT_INPUT_MOCK];

      req.query.owner_id = fakeOwnerId.toString();
      layoutServiceMock.getLayoutsByOwnerId.withArgs(fakeOwnerId).resolves(layoutsByOwner);

      const adaptStub = sinon.stub(LayoutAdapter, 'adaptLayoutForExpressAPI').callsFake((layout) => layout);

      await controller.getLayoutsHandler(req, res);

      strictEqual(res.status.calledOnceWith(200), true);
      ok(res.json, LAYOUT_ADAPTED_MOCK);

      adaptStub.restore();
    });
  });

  suite('getLayoutHandler()', () => {
    let layoutServiceMock = null;
    let controller = null;
    let req = null;
    let res = null;

    beforeEach(() => {
      layoutServiceMock = {
        getLayoutById: sinon.stub(),
      };
      controller = new LayoutController(layoutServiceMock);

      req = { params: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with error if layout repository could not find layout', async () => {
      const id = '123';
      req.params.id = id;
      layoutServiceMock.getLayoutById.rejects(new Error('DB failure'));

      await controller.getLayoutHandler(req, res);

      ok(res.status, 500);
      ok(res.json, {
        message: 'Unable to retrieve layout with id: 123',
        status: 500,
        title: 'Unknown Error',
      });
    });

    test('should successfully return a layout by id', async () => {
      const id = '123';
      req.params.id = id;
      const layoutMock = LAYOUT_INPUT_MOCK;

      layoutServiceMock.getLayoutById.withArgs(id).resolves(layoutMock);

      const adaptStub = sinon.stub(LayoutAdapter, 'adaptLayoutForExpressAPI').returns(LAYOUT_ADAPTED_MOCK);

      await controller.getLayoutHandler(req, res);

      strictEqual(res.status.calledOnceWith(200), true);
      strictEqual(res.json.calledOnceWith(LAYOUT_ADAPTED_MOCK), true);

      adaptStub.restore();
    });

    test('should respond with error if "id" param is missing', async () => {
      req.params.id = undefined;

      await controller.getLayoutHandler(req, res);

      ok(res.status, 400);
      ok(res.json, {
        message: 'Missing parameter "id" of layout',
        status: 400,
        title: 'Invalid Input',
      });
    });
  });

  suite('getLayoutByNameHandler()', () => {
    let layoutServiceMock = null;
    let controller = null;
    let req = null;
    let res = null;

    beforeEach(() => {
      layoutServiceMock = {
        getLayoutByName: sinon.stub(),
      };
      controller = new LayoutController(layoutServiceMock);

      req = { query: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should successfully return layout with name provided', async () => {
      const layoutName = 'CALIBRATIONS';
      req.query.name = layoutName;

      layoutServiceMock.getLayoutByName.withArgs(layoutName).resolves(LAYOUT_INPUT_MOCK);
      const adaptStub = sinon.stub(LayoutAdapter, 'adaptLayoutForExpressAPI').returns(LAYOUT_ADAPTED_MOCK);

      await controller.getLayoutByNameHandler(req, res);

      strictEqual(res.status.calledOnceWith(200), true);
      strictEqual(res.json.calledOnceWith(LAYOUT_ADAPTED_MOCK), true);

      adaptStub.restore();
    });

    test('should successfully return layout with runDefinition and pdpBeamType provided', async () => {
      req.query.runDefinition = 'run42';
      req.query.pdpBeamType = 'Pb-Pb';

      const expectedName = 'run42_Pb-Pb';
      layoutServiceMock.getLayoutByName.withArgs(expectedName).resolves(LAYOUT_INPUT_MOCK);

      const adaptStub = sinon.stub(LayoutAdapter, 'adaptLayoutForExpressAPI').returns(LAYOUT_ADAPTED_MOCK);

      await controller.getLayoutByNameHandler(req, res);

      strictEqual(res.status.calledOnceWith(200), true);
      strictEqual(res.json.calledOnceWith(LAYOUT_ADAPTED_MOCK), true);

      adaptStub.restore();
    });

    test('should return error due to missing input values', async () => {
      // req.query is empty here (no name, no runDefinition, no pdpBeamType)
      await controller.getLayoutByNameHandler(req, res);

      ok(res.status, 400);
      ok(res.json, {
        message: 'Missing query parameters',
        status: 400,
        title: 'Invalid Input',
      });
    });
  });

  suite('putLayoutHandler() tests', () => {
    let layoutServiceMock = null;
    let res = null;

    beforeEach(() => {
      layoutServiceMock = {
        createLayout: sinon.stub(),
        getAllLayouts: sinon.stub(),
        updateLayout: sinon.stub(),
        getLayoutById: sinon.stub(),
      };

      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with 400 error if request did not contain layout id when requesting to update', async () => {
      const req = { params: {} };
      const layoutConnector = new LayoutController({});
      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Missing body content to update layout with',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test('should respond with 400 error if request did not contain body', async () => {
      const req = { params: { id: 'someid' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Missing body content to update layout with',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test('should successfully return the id of the updated layout', async () => {
      const req = {
        params: { id: 'mylayout' },
        session: { personid: '123' },
        body: LAYOUT_ADAPTED_MOCK,
      };
      const layoutConnector = new LayoutController(layoutServiceMock);
      layoutServiceMock.updateLayout.resolves('layout-123');
      layoutServiceMock.getAllLayouts.resolves([]);
      layoutServiceMock.getLayoutById.resolves({ owner: { id: '123' } });

      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith({ id: 'layout-123' }), 'A layout id should have been sent back');
    });
    test('should return 400 code if new provided name already exists', async () => {
      const layoutConnector = new LayoutController(layoutServiceMock);

      layoutServiceMock.getAllLayouts.resolves([{ id: 'layout-456', name: 'something' }]);
      layoutServiceMock.getLayoutById.resolves(LAYOUT_INPUT_MOCK);

      const req = { params: { id: 'mylayout' }, session: { personid: 123, name: 'one' }, body: LAYOUT_ADAPTED_MOCK };
      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Proposed layout name: layout-name already exists',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message is not the same');
    });
    test('should return error if service failed to update layout', async () => {
      layoutServiceMock.getAllLayouts.resolves([]);
      layoutServiceMock.getLayoutById.resolves(LAYOUT_INPUT_MOCK);
      layoutServiceMock.updateLayout.rejects(new Error('Could not update layout'));

      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = {
        params: { id: LAYOUT_ADAPTED_MOCK.id },
        session: { personid: 123, name: 'one' },
        body: LAYOUT_ADAPTED_MOCK,
      };
      await layoutConnector.putLayoutHandler(req, res);

      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({
        message: 'Could not update layout',
        status: 500,
        title: 'Unknown Error',
      }), 'Service error message is incorrect');
    });
  });

  suite('deleteLayoutHandler()', () => {
    let layoutServiceMock = null;
    let controller = null;
    let req = null;
    let res = null;

    beforeEach(() => {
      layoutServiceMock = {
        deleteLayout: sinon.stub(),
        getLayoutById: sinon.stub(),
      };
      controller = new LayoutController(layoutServiceMock);

      req = { params: {} };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should successfully return the id of the deleted layout', async () => {
      const layoutId = '123';
      req.params.id = layoutId;

      layoutServiceMock.deleteLayout.resolves(layoutId);

      await controller.deleteLayoutHandler(req, res);

      ok(res.status, 200);
      ok(res.json, '123');
    });

    test('should return error if data connector failed to delete', async () => {
      const layoutId = '123';
      req.params.id = layoutId;

      // Simulamos que falla la eliminación
      layoutServiceMock.deleteLayout.rejects(new Error('DB failure'));

      await controller.deleteLayoutHandler(req, res);

      strictEqual(res.status.calledOnceWith(500), true);
      ok(res.json.calledOnce);
      ok(res.json.firstCall.args[0].message.includes('Unable to delete layout'));
    });
  });

  suite('postLayoutHandler() tests', () => {
    let layoutServiceMock = null;
    let res = null;

    beforeEach(() => {
      layoutServiceMock = {
        createLayout: sinon.stub(),
        getAllLayouts: sinon.stub(),
      };

      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with 400 error if request did not contain layout "id" when requesting to create', async () => {
      const req = { body: {} };
      const layoutConnector = new LayoutController(layoutServiceMock);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "id" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test(
      'should respond with 400 error if request did not contain layout "name" when requesting to create',
      async () => {
        const req = { body: { id: '1' } };
        const layoutConnector = new LayoutController(layoutServiceMock);
        await layoutConnector.postLayoutHandler(req, res);
        ok(res.status.calledWith(400), 'Response status was not 400');
        ok(res.json.calledWith({
          message: 'Failed to validate layout: "name" is required',
          status: 400,
          title: 'Invalid Input',
        }), 'Error message was incorrect');
      },
    );

    test('should respond with 400 error if request did not contain "tabs" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', id: '1' } };
      const layoutConnector = new LayoutController(layoutServiceMock);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "tabs" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not proper "tabs" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', tabs: [{ some: 'some' }], id: '1' } };
      const layoutConnector = new LayoutController(layoutServiceMock);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "tabs[0].id" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not contain "owner_id" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', tabs: [{ id: '1', name: 'tab' }], id: '1' } };
      const layoutConnector = new LayoutController(layoutServiceMock);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "owner_id" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });

    test(
      'should respond with 400 error if request did not contain "owner_name" when requesting to create',
      async () => {
        const req = { body: { name: 'somelayout', id: '1', owner_id: 123, tabs: [{ id: '123', name: 'tab' }] } };
        const layoutConnector = new LayoutController(layoutServiceMock);
        await layoutConnector.postLayoutHandler(req, res);
        ok(res.status.calledWith(400), 'Response status was not 400');
        ok(res.json.calledWith({
          message: 'Failed to validate layout: "owner_name" is required',
          status: 400,
          title: 'Invalid Input',
        }), 'Error message was incorrect');
      },
    );

    test('should respond with 400 error if request a layout already exists with provided name', async () => {
      const req = {
        body: { name: 'somelayout', id: '1', owner_name: 'admin', owner_id: 123, tabs: [{ id: '123', name: 'tab' }] },
      };
      const layoutConnector = new LayoutController(layoutServiceMock);
      layoutServiceMock.getAllLayouts.resolves([{ name: 'somelayout' }]);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Proposed layout name: somelayout already exists',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });

    test('should successfully return created layout with default for missing values', async () => {
      layoutServiceMock.createLayout.resolves({ layout: 'somelayout' });
      layoutServiceMock.getAllLayouts.resolves([]);

      const expected = {
        id: '1',
        name: 'somelayout',
        owner_id: 1,
        owner_name: 'admin',
        tabs: [{ id: '123', name: 'tab', columns: 2, objects: [] }],
        collaborators: [],
        displayTimestamp: false,
        autoTabChange: 0,
      };
      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = {
        body: { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab' }] },
      };
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(201), 'Response status was not 201');
      ok(res.json.calledWith({ layout: 'somelayout' }), 'A layout should have been sent back');
      ok(layoutServiceMock.createLayout.calledWith(expected), 'New layout body was not used in data connector call');
    });

    test('should return error if data connector failed to create', async () => {
      layoutServiceMock.createLayout.rejects(new Error('Could not create layout'));
      layoutServiceMock.getAllLayouts.resolves([]);

      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = {
        body: { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab' }] },
      };
      const expected = {
        id: '1',
        name: 'somelayout',
        owner_id: 1,
        owner_name: 'admin',
        tabs: [{ id: '123', name: 'tab', columns: 2, objects: [] }],
        collaborators: [],
        displayTimestamp: false,
        autoTabChange: 0,
      };
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({
        message: 'Unable to create new layout',
        status: 500,
        title: 'Unknown Error',
      }), 'DataConnector error message is incorrect');
      ok(layoutServiceMock.createLayout.calledWith(expected), 'New layout body was not used in data connector call');
    });
  });

  suite('postLayoutHandler() tests', () => {
    let res = {};
    let layoutServiceMock = null;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      layoutServiceMock = {
        getAllLayouts: sinon.stub(),
        createLayout: sinon.stub(),
      };
    });
    test('should respond with 400 error if request did not contain layout "id" when requesting to create', async () => {
      const req = { body: {} };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "id" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test('should respond with 400 error if request did not contain layout "id" when requesting to create', async () => {
      const req = { body: {} };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "id" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test(
      'should respond with 400 error if request did not contain layout "name" when requesting to create',
      async () => {
        const req = { body: { id: '1' } };
        const layoutConnector = new LayoutController({});
        await layoutConnector.postLayoutHandler(req, res);
        ok(res.status.calledWith(400), 'Response status was not 400');
        ok(res.json.calledWith({
          message: 'Failed to validate layout: "name" is required',
          status: 400,
          title: 'Invalid Input',
        }), 'Error message was incorrect');
      },
    );
    test('should respond with 400 error if request did not contain "tabs" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', id: '1' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "tabs" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test(
      'should respond with 400 error if request did not provide proper "tabs" when requesting to create',
      async () => {
        const req = { body: { name: 'somelayout', tabs: [{ some: 'some' }], id: '1' } };
        const layoutConnector = new LayoutController({});
        await layoutConnector.postLayoutHandler(req, res);
        ok(res.status.calledWith(400), 'Response status was not 400');
        ok(res.json.calledWith({
          message: 'Failed to validate layout: "tabs[0].id" is required',
          status: 400,
          title: 'Invalid Input',
        }), 'Error message was incorrect');
      },
    );
    test('should respond with 400 error if request did not contain "owner_id" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', tabs: [{ id: '1', name: 'tab' }], id: '1' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "owner_id" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test(
      'should respond with 400 error if request did not contain "owner_name" when requesting to create',
      async () => {
        const req = { body: { name: 'somelayout', id: '1', owner_id: 123, tabs: [{ id: '123', name: 'tab' }] } };
        const layoutConnector = new LayoutController({});
        await layoutConnector.postLayoutHandler(req, res);
        ok(res.status.calledWith(400), 'Response status was not 400');
        ok(res.json.calledWith({
          message: 'Failed to validate layout: "owner_name" is required',
          status: 400,
          title: 'Invalid Input',
        }), 'Error message was incorrect');
      },
    );
    test('should respond with 400 error if a layout already exists with the provided name', async () => {
      const req = {
        body: { name: 'somelayout', id: '1', owner_name: 'admin', owner_id: 123, tabs: [{ id: '123', name: 'tab' }] },
      };
      layoutServiceMock.getAllLayouts.resolves([{ name: 'somelayout' }]);
      const layoutConnector = new LayoutController(layoutServiceMock);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Proposed layout name: somelayout already exists',
        status: 400,
        title: 'Invalid Input',
      }), 'Error message was incorrect');
    });
    test('should successfully return created layout with default values for missing properties', async () => {
      layoutServiceMock.getAllLayouts.resolves([]);
      layoutServiceMock.createLayout.resolves({ layout: 'somelayout' });

      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = {
        body: { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab' }] },
      };
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(201), 'Response status was not 201');
      ok(res.json.calledWith({ layout: 'somelayout' }), 'A layout should have been sent back');
    });

    test('should return error if data connector failed to create layout', async () => {
      layoutServiceMock.getAllLayouts.resolves([]);
      layoutServiceMock.createLayout.rejects(new Error('Could not create layout'));
      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = {
        body: { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab' }] },
      };
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({
        message: 'Unable to create new layout',
        status: 500,
        title: 'Unknown Error',
      }), 'Service error message is incorrect');
    });
  });
  suite('`patchLayoutHandler()` test suite', () => {
    let res = {};
    let layoutServiceMock = null;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      layoutServiceMock = {
        getLayoutById: sinon.stub(),
        patchLayout: sinon.stub(),
      };
    });

    test('should successfully patch the official field of a layout', async () => {
      const layoutId = LAYOUT_ADAPTED_MOCK.id;
      const patchPayload = { isOfficial: true };

      layoutServiceMock.getLayoutById.resolves({ ...LAYOUT_INPUT_MOCK, id: layoutId });
      layoutServiceMock.patchLayout.resolves(layoutId);

      const layoutController = new LayoutController(layoutServiceMock);

      const req = {
        params: { id: layoutId },
        body: patchPayload,
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      await layoutController.patchLayoutHandler(req, res);

      sinon.assert.calledWith(layoutServiceMock.getLayoutById, layoutId);
      sinon.assert.calledWith(layoutServiceMock.patchLayout, layoutId, patchPayload);
      sinon.assert.calledWith(res.status, 200);
      sinon.assert.calledWith(res.json, { id: layoutId });
    });

    test('should return error due to invalid request body containing more than expected fields', async () => {
      const layoutConnector = new LayoutController(layoutServiceMock);

      const req = { params: { id: 'mylayout' }, session: { personid: 1 }, body: { isOfficial: true, missing: true } };
      await layoutConnector.patchLayoutHandler(req, res);

      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({
        message: 'Invalid request body to update layout',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should return error due to layout not found to patch', async () => {
      layoutServiceMock.getLayoutById.rejects(new Error('Unable to find layout'));

      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = { params: { id: 'mylayout' }, session: { personid: 2 }, body: { isOfficial: true } };
      await layoutConnector.patchLayoutHandler(req, res);

      ok(res.status.calledWith(404), 'Response status was not 404');
      ok(res.json.calledWith({ message: 'Unable to find layout with id: mylayout', status: 404, title: 'Not Found' }));
    });

    test('should return error due to layout update operation failing', async () => {
      layoutServiceMock.getLayoutById.resolves(LAYOUT_INPUT_MOCK);
      layoutServiceMock.patchLayout.rejects(new Error('Does not work'));

      const layoutConnector = new LayoutController(layoutServiceMock);
      const req = { params: { id: 'mylayout' }, session: { personid: 1 }, body: { isOfficial: true } };
      await layoutConnector.patchLayoutHandler(req, res);

      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({
        message: 'Unable to update layout with id: mylayout',
        status: 500,
        title: 'Unknown Error',
      }));
      ok(
        layoutServiceMock.patchLayout.calledWith('mylayout', { isOfficial: true }),
        'Layout id was not used in data connector call',
      );
    });
  });
};
