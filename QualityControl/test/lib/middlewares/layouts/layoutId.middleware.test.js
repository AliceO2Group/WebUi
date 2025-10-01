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
import { layoutIdMiddleware } from '../../../../lib/middleware/layouts/layoutId.middleware.js';

/**
 * Test suite for the middlewares involved in the ID check of the layout requests
 */
export const layoutIdMiddlewareTest = () => {
  suite('Layout id middleware', () => {
    const jsonError = {
      message: 'The "id" parameter is missing from the request',
      status: 400,
      title: 'Invalid Input',
    };
    test('Should call next if id is present in req.params', async () => {
      const req = {
        params: {
          id: '123',
        },
      };
      const res = {};
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };
      await layoutIdMiddleware(req, res, next);
      ok(nextCalled, 'Next was not called');
    });
    test('Should return 400 error if id is not present in req.params', async () => {
      const req = {
        params: {
        },
      };
      const res = {
        status: (code) => {
          ok(code === 400, 'Status code was not 400');
          return res;
        },
        json: (obj) => {
          ok(JSON.stringify(obj) === JSON.stringify(jsonError), 'Error message was incorrect');
          return res;
        },
      };
      const next = () => {
        throw new Error('Next should not be called');
      };
      await layoutIdMiddleware(req, res, next);
    });
    test('Should return 400 error if id is empty in req.params', async () => {
      const req = {
        params: {
          id: '',
        },
      };
      const res = {
        status: (code) => {
          ok(code === 400, 'Status code was not 400');
          return res;
        },
        json: (obj) => {
          ok(JSON.stringify(obj) === JSON.stringify(jsonError), 'Error message was incorrect');
          return res;
        },
      };
      const next = () => {
        throw new Error('Next should not be called');
      };
      await layoutIdMiddleware(req, res, next);
    });
    test('Should return 400 error if req.params is not present', async () => {
      const req = {
      };
      const res = {
        status: (code) => {
          ok(code === 400, 'Status code was not 400');
          return res;
        },
        json: (obj) => {
          ok(JSON.stringify(obj) === JSON.stringify(jsonError), 'Error message was incorrect');
          return res;
        },
      };
      const next = () => {
        throw new Error('Next should not be called');
      };
      await layoutIdMiddleware(req, res, next);
    });
  });
};
