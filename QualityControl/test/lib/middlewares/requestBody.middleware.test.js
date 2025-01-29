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
import { layoutIdMiddleware } from '../../../../lib/middleware/layouts/layoutId.middleware.js';
import { requestBodyMiddleware } from '../../../lib/middleware/requestBody.middleware.js';

/**
 * Test suite for the middleware that checks if the request has a body
 */
export const requestBodyMiddlewareTest = () => {
  suite('Request body middleware', () => {
    test('should return an "Invalid input" error if the body is not provided in the request', () => {
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      requestBodyMiddleware()(req, res, next);
      ok(res.status.calledWith(400), 'The status code should be 400');
      ok(res.json.calledWith({
        message: 'Missing body content in request',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should successfully pass the check if the request contains a body', async () => {
      const req = {
        body: {
          test: [],
        },
      };
      const next = sinon.stub().returns();
      await layoutIdMiddleware()(req, {}, next);
      ok(next.called, 'It should call the next middleware');
    });
  });
};
