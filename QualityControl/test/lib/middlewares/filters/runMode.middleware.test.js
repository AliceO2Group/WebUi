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
import { runModeMiddleware } from '../../../../lib/middleware/filters/runMode.middleware.js';

/**
 * Test suite for the run mode middleware that validates run numbers when in run mode
 */
export const runModeMiddlewareTest = () => {
  suite('Run mode middleware', () => {
    test('should call next() immediately if not in run mode', async () => {
      const req = {
        query: {
          inRunMode: false,
        },
      };
      const res = {};
      const next = sinon.stub();

      await runModeMiddleware(req, res, next);

      ok(next.calledOnce, 'next() should be called once');
    });

    test('should call next() immediately if inRunMode is not provided', async () => {
      const req = {
        query: {},
      };
      const res = {};
      const next = sinon.stub();

      await runModeMiddleware(req, res, next);

      ok(next.calledOnce, 'next() should be called once');
    });

    test('should return 400 error if in run mode but RunNumber filter is invalid', async () => {
      const req = {
        query: {
          inRunMode: true,
          filters: {
            RunNumber: 'invalid',
          },
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runModeMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number must be a number',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });

    test('should return 400 error if in run mode but RunNumber is negative', async () => {
      const req = {
        query: {
          inRunMode: true,
          filters: {
            RunNumber: -1,
          },
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runModeMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number must be positive',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });

    test('should successfully validate and parse RunNumber when in run mode', async () => {
      const req = {
        query: {
          inRunMode: true,
          filters: {
            RunNumber: '123456',
          },
        },
      };
      const res = {};
      const next = sinon.stub();

      await runModeMiddleware(req, res, next);

      ok(req.query.filters.RunNumber === 123456, 'RunNumber should be parsed to integer');
      ok(next.calledOnce, 'next() should be called once');
    });

    test('should handle missing filters object when in run mode', async () => {
      const req = {
        query: {
          inRunMode: true,
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();

      await runModeMiddleware(req, res, next);

      ok(res.status.calledWith(400), 'Status should be 400');
      ok(res.json.calledWith({
        message: 'Run number is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Should return validation error message');
      ok(!next.called, 'next() should not be called');
    });
  });
};
