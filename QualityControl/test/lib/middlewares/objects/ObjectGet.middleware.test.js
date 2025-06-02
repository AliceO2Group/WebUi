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
import { getObjectsValidationMiddleware } from '../../../../lib/middleware/objects/ObjectGet.middleWare.js';

/**
 * Test suite for the middleware that checks the owner of the layout
 */

export const ObjectValidationMiddlewareTest = () => {
  suite('Object Validation Middleware', () => {
    suite('getObjectsValidator', () => {
      let req = {};
      let res = {};
      let next = {};
      let getObjectsValidator = {};

      let mockFilterController = {};
      let runTypes = [];

      beforeEach(() => {
        runTypes = ['PHYSICS', 'PROTON-PROTON', '0', '1', '2'];
        mockFilterController = {
          getFilterConfiguration: sinon.stub().returns(runTypes),
          getFilterConfigurationHandler: sinon.stub(),
        };

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

        ({ getObjectsValidator } = getObjectsValidationMiddleware(mockFilterController));
      });

      test('should pass validation with minimal required fields', async () => {
        await getObjectsValidator(req, res, next);
        ok(next.calledOnce, 'Next should be called');
        ok(res.status.notCalled, 'Status should not be called');
      });

      test('should reject request without token', async () => {
        delete req.query.token;
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');

        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: "token" is required',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should accept valid RunNumber filter', async () => {
        req.query.filters = { RunNumber: 123456 };
        await getObjectsValidator(req, res, next);
        ok(next.calledOnce, 'Next should be called');
      });

      test('should reject invalid RunNumber (too high)', async () => {
        req.query.filters = { RunNumber: 1000000 };
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: RunNumber must be a number between 0 and 999999',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject invalid RunNumber (negative)', async () => {
        req.query.filters = { RunNumber: -1 };
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: RunNumber must be a number between 0 and 999999',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should accept valid RunType filter', async () => {
        req.query.filters = { RunType: 'PHYSICS' };
        await getObjectsValidator(req, res, next);
        ok(next.calledOnce, 'Next should be called');
      });

      test('should reject invalid RunType filter', async () => {
        req.query.filters = { RunType: 'INVALID_TYPE' };
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: `Invalid query parameters: RunType must be one of: ${runTypes.join(', ')}`,
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should accept valid PeriodName filter', async () => {
        req.query.filters = { PeriodName: 'LHC22a' };
        await getObjectsValidator(req, res, next);
        ok(next.calledOnce, 'Next should be called');
      });

      test('should reject invalid PeriodName filter (wrong format)', async () => {
        req.query.filters = { PeriodName: 'INVALID_PERIOD' };
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');

        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: PeriodName must match pattern LHC followed by 1-2 digits and letters',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should accept valid PassName filter', async () => {
        req.query.filters = { PassName: 'apass1' };
        await getObjectsValidator(req, res, next);
        ok(next.calledOnce, 'Next should be called');
      });

      test('should reject empty PassName filter', async () => {
        req.query.filters = { PassName: 100 }; // not a string
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');

        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: PassName must be a string',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject unknown filter field', async () => {
        req.query.filters = { UnknownField: 'value' };
        await getObjectsValidator(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');

        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: Unknown filter field: UnknownField',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });
    });
  });
};
