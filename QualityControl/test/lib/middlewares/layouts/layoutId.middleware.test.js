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

import { afterEach, beforeEach, suite, test } from 'node:test';
import { ok } from 'node:assert';
import sinon from 'sinon';
import { layoutIdMiddleware } from '../../../../lib/middleware/layouts/layoutId.middleware.js';

/**
 * Test suite for the middlewares involved in the ID check of the layout requests
 */
export const layoutIdMiddlewareTest = () => {
  suite('layoutIdMiddleware', () => {
    let layoutServiceMock = null;
    let req = null;
    let res = null;
    let next = null;

    beforeEach(() => {
      layoutServiceMock = { getLayoutById: sinon.stub() };
      req = { params: {} };
      res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      next = sinon.stub();
    });

    afterEach(() => {
      sinon.restore();
    });

    test('should call next if layout exists', async () => {
      const id = '123';
      req.params.id = id;
      layoutServiceMock.getLayoutById.resolves({ id });

      const middleware = layoutIdMiddleware(layoutServiceMock);
      await middleware(req, res, next);

      ok(next.calledOnce);
      ok(layoutServiceMock.getLayoutById.calledWith(id));
    });

    test('should return 400 if id param is missing', async () => {
      const middleware = layoutIdMiddleware(layoutServiceMock);
      await middleware(req, res, next);

      ok(next.notCalled);
    });

    test('should return 404 if layout not found', async () => {
      req.params.id = 'non-existent-id';
      layoutServiceMock.getLayoutById.resolves(null);

      const middleware = layoutIdMiddleware(layoutServiceMock);
      await middleware(req, res, next);

      ok(next.notCalled);
    });

    test('should handle unexpected errors', async () => {
      req.params.id = '123';
      const internalError = new Error('Unexpected failure');
      layoutServiceMock.getLayoutById.rejects(internalError);

      const middleware = layoutIdMiddleware(layoutServiceMock);
      await middleware(req, res, next);

      ok(next.notCalled);
    });
  });
};
