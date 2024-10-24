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

/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

import { ok, throws, doesNotThrow, AssertionError } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import sinon from 'sinon';

import { LAYOUT_MOCK_1 } from './../../demoData/layout/layout.mock.js';
import { LayoutController } from './../../../lib/controllers/LayoutController.js';
import { JsonFileService } from './../../../lib/services/JsonFileService.js';

export const layoutControllerTestSuite = async () => {
  suite('Creating a new LayoutController instance', () => {
    test('should throw an error if it is missing service for retrieving data', () => {
      throws(
        () => new LayoutController(undefined),
        new AssertionError({ message: 'Missing service for retrieving layout data', expected: true, operator: '==' }),
      );
      throws(
        () => new LayoutController(undefined),
        new AssertionError({ message: 'Missing service for retrieving layout data', expected: true, operator: '==' }),
      );
    });

    test('should successfully initialize LayoutController', () => {
      doesNotThrow(() => new LayoutController({}));
    });
  });

  suite('`getLayoutsHandler()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with error if data connector could not find layouts', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        listLayouts: sinon.stub().rejects(new Error('Unable to connect')),
      });
      const req = { body: {} };
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.getLayoutsHandler(req, res);
      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({ message: 'Unable to retrieve layouts' }), 'Error message was incorrect');
    });

    test('should successfully return a list of layouts', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        listLayouts: sinon.stub().resolves([{ name: 'somelayout' }]),
      });
      const req = { query: {} };
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.getLayoutsHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith([{ name: 'somelayout' }]), 'A list of layouts should have been sent back');
    });

    test('should successfully return a list of layouts based on owner_id', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        listLayouts: sinon.stub().resolves([{ name: 'somelayout' }]),
      });
      const req = { query: { owner_id: '1' } };
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.getLayoutsHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith([{ name: 'somelayout' }]), 'A list of layouts should have been sent back');
      ok(jsonStub.listLayouts.calledWith({ owner_id: 1 }), 'Owner id was not used in data connector call');
    });
  });

  suite('`getLayoutHandler()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });
    test('should respond with 400 error if request did not contain layout id when requesting to read', async () => {
      const req = { params: {} };
      const layoutConnector = new LayoutController({});
      await layoutConnector.getLayoutHandler(req, res);

      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Missing parameter "id" of layout' }), 'Error message was incorrect');
    });

    test('should successfully return a layout specified by its id', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves([{ layout: 'somelayout' }]),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { params: { id: 'mylayout' } };
      await layoutConnector.getLayoutHandler(req, res);

      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith([{ layout: 'somelayout' }]), 'A JSON defining a layout should have been sent back');
      ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });

    test('should return error if data connector failed', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().rejects(new Error('Unable to read layout')),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { params: { id: 'mylayout' } };

      await layoutConnector.getLayoutHandler(req, res);
      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({ message: 'Unable to retrieve layout with id: mylayout' }), 'Error message was incorrect');
      ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });
  });

  suite('`getLayoutByNameHandler` test suite', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should successfully return layout with name provided', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayoutByName: sinon.stub().resolves([{ name: 'somelayout', id: '1234' }]),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { query: { name: 'somelayout' } };
      await layoutConnector.getLayoutByNameHandler(req, res);

      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith([{ name: 'somelayout', id: '1234' }]), 'A JSON defining a layout should have been sent back');
    });

    test('should successfully return layout with runDefinition and pdpBeamType provided', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayoutByName: sinon.stub().resolves([{ name: 'calibration_pp', id: '1234' }]),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { query: { runDefinition: 'calibration', pdpBeamType: 'pp' } };
      await layoutConnector.getLayoutByNameHandler(req, res);

      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith([{ name: 'calibration_pp', id: '1234' }]), 'A JSON defining a layout should have been sent back');
      ok(jsonStub.readLayoutByName.calledWith('calibration_pp'), 'Incorrect name for layout provided');
    });

    test('should return error due to missing input values', async () => {
      const layoutConnector = new LayoutController({});
      const req = { query: { pdpBeamType: 'pp' } };
      await layoutConnector.getLayoutByNameHandler(req, res);

      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Missing query parameters' }), 'Error message is not as expected');
    });
  });

  suite('`putLayoutHandler()` tests', () => {
    let res;
    beforeEach(() => {
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
      ok(res.json.calledWith({ message: 'Missing parameter "id" of layout' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not contain body id', async () => {
      const req = { params: { id: 'someid' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Missing body content to update layout with' }), 'Error message was incorrect');
    });

    test('should successfully return the id of the updated layout', async () => {
      const expectedMockWithDefaults = {
        id: 'mylayout',
        name: 'something',
        tabs: [{ name: 'tab', id: '1', columns: 2, objects: [] }],
        owner_id: 1,
        owner_name: 'one',
        collaborators: [],
        displayTimestamp: false,
        autoTabChange: 0,
      };
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        updateLayout: sinon.stub().resolves(expectedMockWithDefaults.id),
        listLayouts: sinon.stub().resolves([]),
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
      });
      const layoutConnector = new LayoutController(jsonStub);

      const req = { params: { id: 'mylayout' }, session: { personid: 1, name: 'one' }, body: LAYOUT_MOCK_1 };
      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(201), 'Response status was not 200');
      ok(res.json.calledWith({ id: expectedMockWithDefaults.id }), 'A layout id should have been sent back');
      ok(jsonStub.updateLayout.calledWith('mylayout', expectedMockWithDefaults), 'Layout id was not used in data connector call');
    });

    test('should return 400 code if new provided name already exists', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        listLayouts: sinon.stub().resolves([{ name: 'something' }]),
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
      });
      const layoutConnector = new LayoutController(jsonStub);

      const req = { params: { id: 'mylayout' }, session: { personid: 1, name: 'one' }, body: LAYOUT_MOCK_1 };
      await layoutConnector.putLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Proposed layout name: something already exists' }), 'Error message is not the same');
    });

    test('should return error if data connector failed to update layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
        listLayouts: sinon.stub().resolves([]),
        updateLayout: sinon.stub().rejects(new Error('Could not update layout')),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const expectedMockWithDefaults = {
        id: 'mylayout',
        name: 'something',
        tabs: [{ name: 'tab', id: '1', columns: 2, objects: [] }],
        owner_id: 1,
        owner_name: 'one',
        collaborators: [],
        displayTimestamp: false,
        autoTabChange: 0,
      };
      const req = { params: { id: LAYOUT_MOCK_1.id }, session: { personid: 1, name: 'one' }, body: LAYOUT_MOCK_1 };
      await layoutConnector.putLayoutHandler(req, res);

      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({ message: 'Could not update layout' }), 'DataConnector error message is incorrect');
      ok(jsonStub.updateLayout.calledWith('mylayout', expectedMockWithDefaults), 'Layout id was not used in data connector call');
    });

    test('should return unauthorized error if user requesting update operation is not the owner', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { params: { id: LAYOUT_MOCK_1.id }, session: { personid: 2, name: 'one' }, body: {} };
      await layoutConnector.putLayoutHandler(req, res);

      ok(res.status.calledWith(403), 'Response status was not 403');
      ok(res.json.calledWith({ message: 'Only the owner of the layout can update it' }), 'DataConnector error message is incorrect');
      ok(jsonStub.readLayout.calledWith(LAYOUT_MOCK_1.id), 'Layout id was not used in data connector call');
    });
  });

  suite('`deleteLayoutHandler()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with 400 error if request did not contain layout id when requesting to update', async () => {
      const req = { params: {} };
      const layoutConnector = new LayoutController({});
      await layoutConnector.deleteLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Missing parameter "id" of layout to delete' }), 'Error message was incorrect');
    });

    test('should successfully return the id of the deleted layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
        deleteLayout: sinon.stub().resolves({ id: 'somelayout' }),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { params: { id: 'somelayout' }, session: { personid: 1, name: 'one' } };
      await layoutConnector.deleteLayoutHandler(req, res);
      ok(res.status.calledWith(200), 'Response status was not 200');
      ok(res.json.calledWith({ id: 'somelayout' }), 'A layout id should have been sent back');
      ok(jsonStub.deleteLayout.calledWith('somelayout'), 'Layout id was not used in data connector call');
    });

    test('should return error if data connector failed to delete', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
        deleteLayout: sinon.stub().rejects(new Error('Could not delete layout')),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { params: { id: 'mylayout' }, session: { personid: 1, name: 'one' } };
      await layoutConnector.deleteLayoutHandler(req, res);
      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({ message: 'Unable to delete layout with id: mylayout' }), 'DataConnector error message is incorrect');
      ok(jsonStub.deleteLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });

    test('should return unauthorized error if user requesting delete operation is not the owner', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { params: { id: 'mylayout' }, session: { personid: 2, name: 'one' } };
      await layoutConnector.deleteLayoutHandler(req, res);

      ok(res.status.calledWith(403), 'Response status was not 403');
      ok(res.json.calledWith({ message: 'Only the owner of the layout can delete it' }), 'DataConnector error message is incorrect');
      ok(jsonStub.readLayout.calledWith('mylayout'), 'Layout id was not used in data connector call');
    });
  });

  suite('`postLayoutHandler()` tests', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should respond with 400 error if request did not contain layout "id" when requesting to create', async () => {
      const req = { body: {} };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Failed to validate layout: "id" is required' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not contain layout "name" when requesting to create', async () => {
      const req = { body: { id: '1' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Failed to validate layout: "name" is required' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not contain "tabs" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', id: '1' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Failed to validate layout: "tabs" is required' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not proper "tabs" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', tabs: [{ some: 'some' }], id: '1' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Failed to validate layout: "tabs[0].id" is required' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not contain "owner_id" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', tabs: [{ id: '1', name: 'tab' }], id: '1' } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Failed to validate layout: "owner_id" is required' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request did not contain "owner_name" when requesting to create', async () => {
      const req = { body: { name: 'somelayout', id: '1', owner_id: 123, tabs: [{ id: '123', name: 'tab' }] } };
      const layoutConnector = new LayoutController({});
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Failed to validate layout: "owner_name" is required' }), 'Error message was incorrect');
    });

    test('should respond with 400 error if request a layout already exists with provided name', async () => {
      const req = { body: { name: 'somelayout', id: '1', owner_name: 'admin', owner_id: 123, tabs: [{ id: '123', name: 'tab' }] } };
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        listLayouts: sinon.stub().resolves([{ name: 'somelayout' }]),
      });
      const layoutConnector = new LayoutController(jsonStub);
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Proposed layout name: somelayout already exists' }), 'Error message was incorrect');
    });

    test('should successfully return created layout with default for missing values', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        createLayout: sinon.stub().resolves({ layout: 'somelayout' }),
        listLayouts: sinon.stub().resolves([]),
      });
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
      const layoutConnector = new LayoutController(jsonStub);
      const req = { body: { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab' }] } };
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(201), 'Response status was not 201');
      ok(res.json.calledWith({ layout: 'somelayout' }), 'A layout should have been sent back');
      ok(jsonStub.createLayout.calledWith(expected), 'New layout body was not used in data connector call');
    });

    test('should return error if data connector failed to create', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        createLayout: sinon.stub().rejects(new Error('Could not create layout')),
        listLayouts: sinon.stub().resolves([]),
      });
      const layoutConnector = new LayoutController(jsonStub);
      const req = { body: { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab' }] } };
      const expected = { id: '1', name: 'somelayout', owner_id: 1, owner_name: 'admin', tabs: [{ id: '123', name: 'tab', columns: 2, objects: [] }], collaborators: [], displayTimestamp: false, autoTabChange: 0 };
      await layoutConnector.postLayoutHandler(req, res);
      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({ message: 'Unable to create new layout' }), 'DataConnector error message is incorrect');
      ok(jsonStub.createLayout.calledWith(expected), 'New layout body was not used in data connector call');
    });
  });

  suite('`patchLayoutHandler()` test suite', () => {
    let res;
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
    });

    test('should successfully update the official field of a layout', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
        updateLayout: sinon.stub().resolves({ isOfficial: true, ...LAYOUT_MOCK_1 }),
      });
      const layoutConnector = new LayoutController(jsonStub);

      const req = { params: { id: 'mylayout' }, session: { personid: 1 }, body: { isOfficial: true } };
      await layoutConnector.patchLayoutHandler(req, res);
      ok(res.status.calledWith(201), 'Response status was not 201');
      ok(res.json.calledWith({ isOfficial: true, ...LAYOUT_MOCK_1 }));
      ok(jsonStub.updateLayout.calledWith('mylayout', { isOfficial: true }));
    });

    test('should return error due to invalid request body containing more than expected fields', async () => {
      const layoutConnector = new LayoutController({});

      const req = { params: { id: 'mylayout' }, session: { personid: 1 }, body: { isOfficial: true, missing: true } };
      await layoutConnector.patchLayoutHandler(req, res);

      ok(res.status.calledWith(400), 'Response status was not 400');
      ok(res.json.calledWith({ message: 'Invalid request body to update layout' }));
    });

    test('should return error due to layout not found to patch', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().rejects(new Error('Unable to find layout')),
      });
      const layoutConnector = new LayoutController(jsonStub);

      const req = { params: { id: 'mylayout' }, session: { personid: 2 }, body: { isOfficial: true } };
      await layoutConnector.patchLayoutHandler(req, res);

      ok(res.status.calledWith(404), 'Response status was not 403');
      ok(res.json.calledWith({ message: 'Unable to find layout with id: mylayout' }));
    });

    test('should return error due to layout update operation failing', async () => {
      const jsonStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves(LAYOUT_MOCK_1),
        updateLayout: sinon.stub().rejects(new Error('Does not work')),
      });
      const layoutConnector = new LayoutController(jsonStub);

      const req = { params: { id: 'mylayout' }, session: { personid: 1 }, body: { isOfficial: true } };
      await layoutConnector.patchLayoutHandler(req, res);

      ok(res.status.calledWith(500), 'Response status was not 500');
      ok(res.json.calledWith({ message: 'Unable to update layout with id: mylayout' }));
      ok(jsonStub.updateLayout.calledWith('mylayout', { isOfficial: true }), 'Layout id was not used in data connector call');
    });
  });
};
