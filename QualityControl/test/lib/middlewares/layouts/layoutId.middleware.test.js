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
import sinon from 'sinon';
import { NotFoundError } from '@aliceo2/web-ui';

/**
 * Test suite for the middlewares involved in the ID check of the layout requests
 */
export const layoutIdMiddlewareTest = () => {
  suite('Layout id middleware', () => {
    const mockLayoutService = {
      getLayoutById: sinon.stub(),
    };
    const middleware = layoutIdMiddleware(mockLayoutService);
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    test('should add the layout to the request object when id is valid', async () => {
      const req = {
        params: { id: 'valid-id' },
      };
      const next = sinon.spy();
      const mockLayout = { id: 'valid-id', name: 'Test Layout' };
      mockLayoutService.getLayoutById.resolves(mockLayout);

      await middleware(req, res, next);
    });
    test('should throw invalid input error when id is missing', async () => {
      const req = {
        params: {},
      };
      const next = sinon.spy();
      await middleware(req, res, next);
      ok(res.status.calledWith(400), `Expected status 400 but got ${res.status.firstCall.args[0]}`);
      ok(res.json.calledWith({
        message: 'Layout id is required',
        status: 400,
        title: 'Invalid Input',
      }), 'Expected error message for missing id');
      ok(next.notCalled, 'Expected next not to be called');
    });
    test('should throw invalid input error when layout is not found', async () => {
      const req = {
        params: { id: 'non-existent-id' },
      };
      const next = sinon.spy();
      mockLayoutService.getLayoutById.rejects(new NotFoundError('Layout with id: non-existent-id was not found'));

      await middleware(req, res, next);
      ok(res.status.calledWith(404), `Expected status 400 but got ${res.status.firstCall.args[0]}`);
      ok(res.json.calledWith({
        message: 'Layout with id: non-existent-id was not found',
        status: 404,
        title: 'Not Found',
      }), 'Expected error message for layout not found');
      ok(next.notCalled, 'Expected next not to be called');
    });
  });
};
