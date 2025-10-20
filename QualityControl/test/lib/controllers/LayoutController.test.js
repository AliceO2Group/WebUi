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

import { ok } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import sinon from 'sinon';

import { LayoutController } from './../../../lib/controllers/LayoutController.js';
import { LAYOUT_CONTROLLER_MOCK_1, LAYOUT_CONTROLLER_MOCK_2 } from '../../demoData/layout/layout.mock.js';

export const layoutControllerTestSuite = async () => {
  let req = {};
  let res = {};
  let layoutServiceMock = {};
  let layoutController = null;
  beforeEach(() => {
    req = {
      query: {
        token: 'validtoken',
      },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    layoutServiceMock = {
      getLayoutsByFilters: sinon.stub(),
      getLayoutById: sinon.stub(),
      getLayoutByName: sinon.stub(),
      putLayout: sinon.stub(),
      removeLayout: sinon.stub(),
      postLayout: sinon.stub(),
      patchLayout: sinon.stub(),
    };
    layoutController = new LayoutController(layoutServiceMock);
  });
  suite('Layout controller - constructor', () => {
    test('should throw an error if layout service is not provided', () => { });
  });
  suite('getLayoutsHandler', () => {
    test('should throw invalid input error if Joi validation fails', async () => {
      req.query.fields = 'invalid_field';
      await layoutController.getLayoutsHandler(req, res);

      ok(res.status.calledWith(400));
      ok(res.json.calledWith({
        message: 'Invalid query parameters: "fields" contains invalid field: invalid_field',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should call getLayoutsByFilters from layoutService with correct parameters', async () => {
      req.query.fields = 'id,name';
      req.query.owner_id = 123;

      const mockLayouts = [
        LAYOUT_CONTROLLER_MOCK_1,
        LAYOUT_CONTROLLER_MOCK_2,
      ];

      layoutServiceMock.getLayoutsByFilters.resolves(mockLayouts);

      await layoutController.getLayoutsHandler(req, res);
      ok(res.status.calledWith(200));
      ok(res.json.calledWith([
        { id: 10001, name: 'Test Layout 1' },
        { id: 10002, name: 'Test Layout 2' },
      ]));
    });

    test('should throw if layoutService.getLayoutsByFilters throws', async () => {
      delete req.query.owner_id;

      layoutServiceMock.getLayoutsByFilters.rejects(new Error());

      await layoutController.getLayoutsHandler(req, res);

      ok(res.status.calledWith(500));
      ok(res.json.calledWith({
        message: 'Unable to retrieve layouts',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });

  suite('getLayoutHandler', () => {
    test('should call getLayoutById from layoutService with correct parameters', async () => {
      req.params = { id: 10001 };

      const mockLayout = LAYOUT_CONTROLLER_MOCK_1;

      layoutServiceMock.getLayoutById.resolves(mockLayout);

      await layoutController.getLayoutHandler(req, res);
      ok(res.status.calledWith(200));
      ok(res.json.calledWith({
        id: 10001,
        name: 'Test Layout 1',
        owner_id: 123,
        owner_name: 'Owner 1',
        description: undefined,
        displayTimestamp: undefined,
        autoTabChange: undefined,
        tabs: [{ id: 1, name: 'Tab 1', columns: 2, objects: [] }],
        isOfficial: true,
        collaborators: [],
      }));
    });
    test('should throw if layoutService.getLayoutById throws', async () => {
      req.params = { id: 99999 };

      layoutServiceMock.getLayoutById.rejects(new Error('Server error'));

      await layoutController.getLayoutHandler(req, res);

      ok(res.status.calledWith(500));
      ok(res.json.calledWith({
        message: 'Server error',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });

  suite('getLayoutByNameHandler', () => {
    test('should set the proper name to the layout', async () => {
      req.query = { name: 'Test Layout' };
      await layoutController.getLayoutByNameHandler(req, res);
      ok(layoutServiceMock.getLayoutByName.calledWith('Test Layout'));
      sinon.resetHistory();
      req.query = { runDefinition: 'RunDef', pdpBeamType: 'BeamType' };
      await layoutController.getLayoutByNameHandler(req, res);
      ok(layoutServiceMock.getLayoutByName.calledWith('RunDef_BeamType'));
      sinon.resetHistory();
      req.query = { runDefinition: 'RunDef' };
      await layoutController.getLayoutByNameHandler(req, res);
      ok(layoutServiceMock.getLayoutByName.calledWith('RunDef'));
    });
    test('should return 200 and layout data when layoutService.getLayoutByName resolves', async () => {
      const mockLayout = LAYOUT_CONTROLLER_MOCK_1;
      layoutServiceMock.getLayoutByName.resolves(mockLayout);
      req.query = { name: 'Test Layout' };
      await layoutController.getLayoutByNameHandler(req, res);
      ok(res.status.calledWith(200));
      ok(res.json.calledWith({
        id: 10001,
        name: 'Test Layout 1',
        owner: { id: 123, name: 'Owner 1' },
        tabs: [{ id: 1, name: 'Tab 1', gridTabCells: [] }],
        is_official: true,
      }));
    });
    test('should return error when layoutService.getLayoutByName rejects', async () => {
      layoutServiceMock.getLayoutByName.rejects(new Error('Server error'));
      req.query = { name: 'Test Layout' };
      await layoutController.getLayoutByNameHandler(req, res);
      ok(res.status.calledWith(500));
      ok(res.json.calledWith({
        message: 'Server error',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });
  suite('putLayoutHandler', () => {
    test('should throw invalid input error if Joi validation fails', async () => {
      req.params = { id: 10001 };
      req.body = {
        name: 'Updated Layout',
        tabs: 'invalid_tabs_format',
      };

      await layoutController.putLayoutHandler(req, res);

      ok(res.status.calledWith(400));
      ok(res.json.calledWith({
        message: 'Failed to update layout: "tabs" must be an array',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should return updated layout ID when layoutService.putLayout resolves', async () => {
      req.params = { id: 10001 };
      req.body = {
        name: 'Updated Layout',
        tabs: [{ id: 1, name: 'Tab 1' }],
        owner_id: 123,
        owner_name: 'Owner 1',
      };

      layoutServiceMock.putLayout.resolves(10001);
      await layoutController.putLayoutHandler(req, res);

      ok(res.status.calledWith(200));
      ok(res.json.calledWith({ id: 10001 }));
    });
  });
  suite('postLayoutHandler', () => {
    test('should throw invalid input error if Joi validation fails', async () => {
      req.body = {
        name: 'New Layout',
        tabs: 'invalid_tabs_format',
      };

      await layoutController.postLayoutHandler(req, res);

      ok(res.status.calledWith(400));
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "tabs" must be an array',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should return new layout ID when layoutService.postLayout resolves', async () => {
      req.body = {
        name: 'New Layout',
        tabs: [{ id: 1, name: 'Tab 1' }],
        owner_id: 123,
        owner_name: 'Owner 1',
      };

      layoutServiceMock.postLayout.resolves({ id: 10003 });
      await layoutController.postLayoutHandler(req, res);

      ok(res.status.calledWith(201));
      ok(res.json.calledWith({ id: 10003 }));
    });
  });
  suite('deleteLayoutHandler', () => {
    test('should return result when layoutService.removeLayout resolves', async () => {
      req.params = { id: 10001 };

      layoutServiceMock.removeLayout.resolves();

      await layoutController.deleteLayoutHandler(req, res);

      ok(res.status.calledWith(200));
      ok(res.json.calledWith({ id: 10001 }));
    });
    test('should throw if layoutService.removeLayout throws', async () => {
      req.params = { id: 99999 };

      layoutServiceMock.removeLayout.rejects(new Error('Server error'));
      await layoutController.deleteLayoutHandler(req, res);

      ok(res.status.calledWith(500));
      ok(res.json.calledWith({
        message: 'Server error',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });

  suite('patchLayoutHandler', () => {
    // change isOfficial to true
    test('should throw invalid input error if Joi validation fails', async () => {
      req.params = { id: 10001 };
      req.body = {
        isOfficial: 'not_a_boolean',
      };

      await layoutController.patchLayoutHandler(req, res);

      ok(res.status.calledWith(400));
      ok(res.json.calledWith({
        message: 'Failed to validate layout: "isOfficial" must be a boolean',
        status: 400,
        title: 'Invalid Input',
      }));
    });
    test('should return updated layout ID when layoutService.patchLayout resolves', async () => {
      req.params = { id: 10001 };
      req.body = {
        isOfficial: true,
      };

      layoutServiceMock.patchLayout.resolves(10001);
      await layoutController.patchLayoutHandler(req, res);

      ok(res.status.calledWith(200));
      ok(res.json.calledWith({ id: 10001 }));
    });
  });
};
