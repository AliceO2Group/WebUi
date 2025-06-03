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

import { beforeEach, suite, test } from 'node:test';
import { ok } from 'node:assert';
import sinon from 'sinon';
import { objectsGetValidationMiddlewareFactory } from
  '../../../../lib/middleware/objects/objectsGetValidationMiddlewareFactory.js';

/**
 * Test suite for the middleware that validates query parameters
 */

export const objectsGetValidationMiddlewareTest = () => {
  suite('Objects get validation Middleware', () => {
    let req = {};
    let res = {};
    let next = {};
    let middleWare = {};

    let mockFilterService = {};
    let runTypes = [];

    beforeEach(() => {
      runTypes = ['PHYSICS', 'PROTON-PROTON', '0', '1', '2'];
      mockFilterService = { runTypes };

      req = {
        query: {
          token: 'valid-token',
        },
      };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      next = sinon.stub();

      middleWare = objectsGetValidationMiddlewareFactory(mockFilterService);
    });

    test('should pass validation with minimal required fields', async () => {
      await middleWare(req, res, next);
      ok(next.calledOnce, 'Next should be called');
      ok(res.status.notCalled, 'Status should not be called');
    });

    test('should reject request without token', async () => {
      delete req.query.token;
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');

      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "token" is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should accept valid RunNumber filter', async () => {
      req.query.filters = { RunNumber: 123456 };
      await middleWare(req, res, next);
      ok(next.calledOnce, 'Next should be called');
    });

    test('should reject invalid RunNumber (too high)', async () => {
      req.query.filters = { RunNumber: 1000000 };
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');

      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters.RunNumber" must be less than or equal to 999999',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should reject invalid RunNumber (negative)', async () => {
      req.query.filters = { RunNumber: -1 };
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');

      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters.RunNumber" must be greater than or equal to 0',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should accept valid RunType filter', async () => {
      req.query.filters = { RunType: 'PHYSICS' };
      await middleWare(req, res, next);
      ok(next.calledOnce, 'Next should be called');
    });

    test('should reject invalid RunType filter', async () => {
      req.query.filters = { RunType: 'INVALID_TYPE' };
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');
      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters.RunType" must be one of [PHYSICS, PROTON-PROTON, 0, 1, 2]',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should accept valid PeriodName filter', async () => {
      req.query.filters = { PeriodName: 'LHC22a' };
      await middleWare(req, res, next);
      ok(next.calledOnce, 'Next should be called');
    });

    test('should reject invalid PeriodName filter (wrong format)', async () => {
      req.query.filters = { PeriodName: 'INVALID_PERIOD' };
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');
      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters.PeriodName" with value "INVALID_PERIOD"' +
        ' fails to match the required pattern: /^LHC\\d{1,2}[a-z]+$/i',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should accept valid PassName filter', async () => {
      req.query.filters = { PassName: 'apass1' };
      await middleWare(req, res, next);
      ok(next.calledOnce, 'Next should be called');
    });

    test('should reject non-object filters', async () => {
      req.query.filters = 'PassName=100';
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');
      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters" must be of type object',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should reject empty PassName filter', async () => {
      req.query.filters = { PassName: 100 }; // not a string
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');
      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters.PassName" must be a string',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });

    test('should reject unknown filter field', async () => {
      req.query.filters = { UnknownField: 'value' };
      await middleWare(req, res, next);
      ok(res.status.calledWith(400), 'Should return 400 status');

      ok(res.json.calledWithMatch({
        message: 'Invalid query parameters: "filters.UnknownField" is not allowed',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error');
    });
  });
};
