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
import { objectGetContentsValidationMiddlewareFactory }
  from '../../../../lib/middleware/objects/objectGetContentsValidationMiddlewareFactory.js';

/**
 * Test suite for the middleware that validates query parameters
 */

export const objectGetContentsValidationMiddlewareTest = () => {
  suite('Object get contents validation Middleware', () => {
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

      middleWare = objectGetContentsValidationMiddlewareFactory(mockFilterService);
    });
    suite('getObjectContent() tests', () => {
      test('should successfully validate a request with token and path', async () => {
        req.query.path = 'valid/path';
        await middleWare(req, res, next);
        ok(next.calledOnce, 'Should call next() on successful validation');
        ok(res.status.notCalled, 'Should not set status on success');
        ok(res.json.notCalled, 'Should not send response on success');
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

      test('should reject request with a non-string path', async () => {
        req.query.path = 1;
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: "path" must be a string',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should reject request with empty path', async () => {
        req.query.path = '';
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: "path" is not allowed to be empty',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should successfully validate request with valid filters', async () => {
        req.query.path = 'valid/path';
        req.query.filters = {
          RunNumber: '12345',
          RunType: 'PHYSICS',
          PeriodName: 'LHC22a',
          PassName: 'pass1',
        };
        await middleWare(req, res, next);
        ok(next.calledOnce, 'Should call next() when filters are valid');
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

      test('should reject request with invalid RunNumber filter', async () => {
        req.query.path = 'valid/path';
        req.query.filters = { RunNumber: 'abc' };
        await middleWare(req, res, next);
        ok(res.status.calledWith(400), 'Should return 400 status');
        ok(res.json.calledWithMatch({
          message: 'Invalid query parameters: Run number must be a number',
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
          message: 'Invalid query parameters: "filters.RunType" must be one of [PHYSICS, PROTON-PROTON, 0, 1, 2]',
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
          message: 'Invalid query parameters: "filters.PeriodName" with value "invalid-period"' +
          ' fails to match the required pattern: /^LHC\\d{1,2}[a-z]+$/i',
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
          message: 'Invalid query parameters: "filters.UnknownField" is not allowed',
          status: 400,
          title: 'Invalid Input',
        }), 'Should return validation error');
      });

      test('should successfully validate request with validFrom timestamp', async () => {
        req.query.path = 'valid/path';
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
