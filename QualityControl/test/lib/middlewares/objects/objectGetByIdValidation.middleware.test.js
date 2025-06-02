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
import { objectGetByIdValidationMiddlewareFactory }
  from '../../../../lib/middleware/objects/objectGetByIdValidationMiddlewareFactory.js';

/**
 * Test suite for the middleware that validates query parameters
 */

export const objectGetByIdValidationMiddlewareTest = () => {
  suite('Object get by id validation Middleware', () => {
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
        params: {
          id: 'valid-id',
        },
      };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      next = sinon.stub();

      middleWare = objectGetByIdValidationMiddlewareFactory(mockFilterService);
    });

    suite('getObjectContent() tests', () => {
      test('should successfully validate a request with valid query parameters', async () => {
        await middleWare(req, res, next);
        ok(next.calledOnce, 'Should call next() on successful validation');
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

      test('should successfully validate request with valid filters', async () => {
        req.query.filters = {
          RunNumber: '12345',
          RunType: 'PHYSICS',
          PeriodName: 'LHC22a',
          PassName: 'pass1',
        };
        await middleWare(req, res, next);
        ok(next.calledOnce, 'Should call next() when filters are valid');
      });

      test('should reject request with invalid RunNumber filter', async () => {
        req.query.path = 'valid/path';
        req.query.filters = { RunNumber: 'abc' };
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: RunNumber must be a number between 0 and 999999',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject request with invalid RunType filter', async () => {
        req.query.path = 'valid/path';
        req.query.filters = { RunType: 'INVALID_TYPE' };
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: `Invalid query parameters: RunType must be one of: ${runTypes.join(', ')}`,
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject request with invalid PeriodName filter', async () => {
        req.query.path = 'valid/path';
        req.query.filters = { PeriodName: 'invalid-period' };
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message:
      'Invalid query parameters: PeriodName must match pattern LHC followed by 1-2 digits and letters',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject request with unknown filter field', async () => {
        req.query.path = 'valid/path';
        req.query.filters = { UnknownField: 'value' };
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: Unknown filter field: UnknownField',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should successfully validate request with validFrom timestamp', async () => {
        req.query.validFrom = '1234567890';
        await middleWare(req, res, next);
        ok(next.calledOnce, 'Should call next() when validFrom is valid');
      });

      test('should reject request with negative validFrom timestamp', async () => {
        req.query.path = 'valid/path';
        req.query.validFrom = '-1';
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: "validFrom" must be greater than or equal to 0',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject request with non-numeric validFrom', async () => {
        req.query.path = 'valid/path';
        req.query.validFrom = 'not-a-number';
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: "validFrom" must be a number',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });
    });
  });
};
