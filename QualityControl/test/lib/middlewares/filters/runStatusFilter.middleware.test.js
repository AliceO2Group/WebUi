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

import { suite, test } from 'node:test';
import { ok } from 'node:assert';
import sinon from 'sinon';
import { runStatusFilterMiddleware } from '../../../../lib/middleware/filters/runStatusFilter.middleware.js';

/**
 * Test suite for the run status middleware that validates run numbers from URL parameters
 */
export const runStatusFilterMiddlewareTest = () => {
  suite('Run status middleware', () => {
    test('should return 400 error if run number parameter is missing', async () => {
      const req = {
        params: {},
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });

    test('should return 400 error if run number is not a valid number', async () => {
      const req = {
        params: {
          runNumber: 'invalid',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number must be a number',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });

    test('should return 400 error if run number is negative', async () => {
      const req = {
        params: {
          runNumber: '-1',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number must be greater than 0',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });

    test('should return 400 error if run number exceeds maximum value', async () => {
      const req = {
        params: {
          runNumber: '1000000',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number must not exceed 999999',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });

    test('should successfully validate and attach run number to request', async () => {
      const req = {
        params: {
          runNumber: '123456',
        },
      };
      const res = {};
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(req.params.runNumber === 123456, 'Run number should be parsed and attached to request');
      ok(next.calledOnce, 'next() should be called once');
    });

    test('should handle numeric run number parameter', async () => {
      const req = {
        params: {
          runNumber: 654321,
        },
      };
      const res = {};
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(req.params.runNumber === 654321, 'Numeric run number should be validated and attached');
      ok(next.calledOnce, 'next() should be called once');
    });

    test('should validate run number at boundary values', async () => {
      const req = {
        params: {
          runNumber: '999999',
        },
      };
      const res = {};
      const next = sinon.stub();

      await runStatusFilterMiddleware(req, res, next);

      ok(req.params.runNumber === 999999, 'Maximum valid run number should be accepted');
      ok(next.calledOnce, 'next() should be called once');
    });
  });
};
