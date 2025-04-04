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

/**
 * Test suite for the middlewares involved in the ID check of the layout requests
 */
export const layoutIdMiddlewareTest = () => {
  suite('Layout ID Middleware', () => {
    test('should return an "Invalid input" error if the layout ID is missing', async () => {
      const req = { params: { id: '' } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub();
      layoutIdMiddleware()(req, res, next);

      ok(res.status.calledWith(400), 'The status code should be 400');
      ok(res.json.calledWith({
        message: 'The "id" parameter is missing from the request',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should call next if layout ID is provided', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub();
      layoutIdMiddleware()(req, res, next);

      ok(next.calledOnce, 'Next should be called once');
    });
  });
};
