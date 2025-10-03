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

import { ok, throws, doesNotThrow, AssertionError } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import sinon from 'sinon';

import { LayoutController } from './../../../lib/controllers/LayoutController.js';
import { LAYOUT_ADAPTED_FOR_FRONTEND_API, LAYOUT_FROM_BACKEND } from '../../demoData/layout/layout.mock.js';

export const layoutControllerTestSuite = async () => {
  suite('LayoutController Test Suite', () => {
    let req = {};
    let res = {};
    let layoutServiceMock = null;
    let layoutController = null;
    beforeEach(() => {
      req = {};
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      layoutServiceMock = {
        getLayoutsByFilters: sinon.stub(),
        getLayoutByName: sinon.stub(),
      };
      layoutController = new LayoutController(layoutServiceMock);
    });

    suite('Creating a new LayoutController instance', () => {
      test('should throw an error if it is missing service for retrieving data', () => {
        throws(
          () => new LayoutController(undefined),
          new AssertionError({ message: 'Missing layout service', expected: true, operator: '==' }),
        );
      });

      test('should successfully initialize LayoutController', () => {
        doesNotThrow(() => new LayoutController({}));
      });
    });

    suite('`getLayoutsHandler()` tests', () => {
      test('should successfully return a list of layouts', async () => {
        req = { query: { owner_id: 'test-owner-id', filter: {} } };
        layoutServiceMock.getLayoutsByFilters = sinon.stub().resolves([LAYOUT_FROM_BACKEND]);
        await layoutController.getLayoutsHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(res.json.calledWith([LAYOUT_ADAPTED_FOR_FRONTEND_API]), 'A JSON defining a layout should have been sent back');
      });
      test('should successfully return a list of layouts with only requested fields', async () => {
        req = { query: { owner_id: 'test-owner-id', filter: {}, fields: ['id', 'name'] } };
        layoutServiceMock.getLayoutsByFilters = sinon.stub().resolves([LAYOUT_FROM_BACKEND]);
        await layoutController.getLayoutsHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(
          res.json.calledWith([{ id: LAYOUT_FROM_BACKEND.id, name: LAYOUT_FROM_BACKEND.name }]),
          'A JSON defining a layout should have been sent back with only requested fields',
        );
      });
      test('should return error if service failed to retrieve layouts', async () => {
        req = { query: { owner_id: 'test-owner-id', filter: {} } };
        layoutServiceMock.getLayoutsByFilters = sinon.stub().rejects(new Error('Unable to retrieve layouts'));
        await layoutController.getLayoutsHandler(req, res);
        ok(res.status.calledWith(500), 'Response status was not 500');
        ok(res.json.calledWith({
          message: 'Unable to retrieve layouts',
          status: 500,
          title: 'Unknown Error',
        }), 'Error message was incorrect');
      });
    });
    suite('`getLayoutByIdHandler()` tests', () => {
      test('should successfully return a layout specified by its id', async () => {
        req = { params: { id: 'test-layout-id' }, layout: LAYOUT_FROM_BACKEND };
        await layoutController.getLayoutHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(res.json.calledWith(LAYOUT_ADAPTED_FOR_FRONTEND_API), 'A JSON defining a layout should have been sent back');
      });
    });
    suite('`getLayoutByNameHandler()` tests', () => {
      test('should successfully call getLLayoutByName with name', async () => {
        layoutServiceMock.getLayoutByName = sinon.stub().resolves(LAYOUT_FROM_BACKEND);
        req = { query: { name: 'CALIBRATIONS' } };
        await layoutController.getLayoutByNameHandler(req, res);
        ok(
          layoutServiceMock.getLayoutByName.calledWith('CALIBRATIONS'),
          'Service was not called with correct parameters',
        );
      });
      test('should successfully call getLayoutByName with runDefinition and pdpBeamType', async () => {
        layoutServiceMock.getLayoutByName = sinon.stub().resolves(LAYOUT_FROM_BACKEND);
        req = { query: { runDefinition: 'LHC18b', pdpBeamType: 'A' } };
        await layoutController.getLayoutByNameHandler(req, res);
        ok(
          layoutServiceMock.getLayoutByName.calledWith('LHC18b_A'),
          'Service was not called with correct parameters',
        );
      });
      test('should successfully call getLayoutByName with only runDefinition', async () => {
        layoutServiceMock.getLayoutByName = sinon.stub().resolves([LAYOUT_FROM_BACKEND]);
        req = { query: { runDefinition: 'LHC18b' } };
        await layoutController.getLayoutByNameHandler(req, res);
        ok(
          layoutServiceMock.getLayoutByName.calledWith('LHC18b'),
          'Service was not called with correct parameters',
        );
      });
      test('should return error if neither name nor runDefinition is provided', async () => {
        req = { query: {} };
        await layoutController.getLayoutByNameHandler(req, res);
        ok(res.status.calledWith(400), 'Response status was not 400');
        ok(res.json.calledWith({
          message: 'Missing query parameters',
          status: 400,
          title: 'Invalid Input',
        }), 'Error message was incorrect');
      });
      test('should successfully return a layout specified by its name', async () => {
        req = { query: { name: 'CALIBRATIONS' } };
        layoutServiceMock.getLayoutByName = sinon.stub().resolves(LAYOUT_FROM_BACKEND);
        await layoutController.getLayoutByNameHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(res.json.calledWith(LAYOUT_ADAPTED_FOR_FRONTEND_API), 'A JSON defining a layout should have been sent back');
      });
    });
    suite('`putLayoutHandler()` tests', () => {
      test('should successfully update a layout specified by its id', async () => {
        req = { params: { id: 'test-layout-id' }, body: {} };
        layoutServiceMock.putLayout = sinon.stub().resolves('test-layout-id');
        await layoutController.putLayoutHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(
          res.json.calledWith({ id: 'test-layout-id' }),
          'A JSON with the updated layout ID should have been sent back',
        );
      });
      test('should return error if service failed to update layout', async () => {
        req = { params: { id: 'test-layout-id' }, body: {} };
        layoutServiceMock.putLayout = sinon.stub().rejects(new Error('Unable to update layout'));
        await layoutController.putLayoutHandler(req, res);
        ok(res.status.calledWith(500), 'Response status was not 500');
        ok(res.json.calledWith({
          message: 'Unable to update layout',
          status: 500,
          title: 'Unknown Error',
        }), 'Error message was incorrect');
      });
    });
    suite('`deleteLayoutHandler()` tests', () => {
      test('should successfully delete a layout specified by its id', async () => {
        req = { params: { id: 'test-layout-id' } };
        layoutServiceMock.removeLayout = sinon.stub().resolves({ id: 'test-layout-id', deleted: true });
        await layoutController.deleteLayoutHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(
          res.json.calledWith({ id: 'test-layout-id', deleted: true }),
          'A JSON with the deletion result should have been sent back',
        );
      });
      test('should return error if service failed to delete layout', async () => {
        req = { params: { id: 'test-layout-id' } };
        layoutServiceMock.removeLayout = sinon.stub().rejects(new Error('Unable to delete layout'));
        await layoutController.deleteLayoutHandler(req, res);
        ok(res.status.calledWith(500), 'Response status was not 500');
        ok(res.json.calledWith({
          message: 'Unable to delete layout',
          status: 500,
          title: 'Unknown Error',
        }), 'Error message was incorrect');
      });
    });
    suite('`postLayoutHandler()` tests', () => {
      test('should successfully create a new layout', async () => {
        req = { body: LAYOUT_ADAPTED_FOR_FRONTEND_API };
        layoutServiceMock.postLayout = sinon.stub().resolves(LAYOUT_ADAPTED_FOR_FRONTEND_API);
        await layoutController.postLayoutHandler(req, res);
        ok(res.status.calledWith(201), 'Response status was not 201');
        ok(res.json.calledWith(LAYOUT_ADAPTED_FOR_FRONTEND_API), 'A JSON with the new layout should have been sent back');
      });
      test('should return error if service failed to create a new layout', async () => {
        req = { body: LAYOUT_ADAPTED_FOR_FRONTEND_API };
        layoutServiceMock.postLayout = sinon.stub().rejects(new Error('Unable to create layout'));
        await layoutController.postLayoutHandler(req, res);
        ok(res.status.calledWith(500), 'Response status was not 500');
        ok(res.json.calledWith({
          message: 'Unable to create layout',
          status: 500,
          title: 'Unknown Error',
        }), 'Error message was incorrect');
      });
    });
    suite('`patchLayoutHandler()` tests', () => {
      test('should successfully patch a layout specified by its id', async () => {
        req = { params: { id: 'test-layout-id' }, body: {} };
        layoutServiceMock.patchLayout = sinon.stub().resolves('test-layout-id');
        await layoutController.patchLayoutHandler(req, res);
        ok(res.status.calledWith(200), 'Response status was not 200');
        ok(
          res.json.calledWith({ id: 'test-layout-id' }),
          'A JSON with the patched layout ID should have been sent back',
        );
      });
      test('should return error if service failed to patch layout', async () => {
        req = { params: { id: 'test-layout-id' }, body: {} };
        layoutServiceMock.patchLayout = sinon.stub().rejects(new Error('Unable to patch layout'));
        await layoutController.patchLayoutHandler(req, res);
        ok(res.status.calledWith(500), 'Response status was not 500');
        ok(res.json.calledWith({
          message: 'Unable to patch layout',
          status: 500,
          title: 'Unknown Error',
        }), 'Error message was incorrect');
      });
    });
  });
};
