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
import { layoutOwnerMiddleware } from '../../../../lib/middleware/layouts/layoutOwner.middleware.js';

export const layoutOwnerMiddlewareTest = async () => {
  /**
   * Test suite for layoutOwnerMiddleware using real UserDto validation
   */
  suite('Layout owner middleware', () => {
    let layoutService = null;
    let res = null;
    let next = null;

    beforeEach(() => {
      layoutService = { getLayoutById: sinon.stub() };
      res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      next = sinon.stub();
    });

    test('should return NotFoundError if session is missing', async () => {
      const req = { params: { id: 'layoutId' } };
      await layoutOwnerMiddleware(layoutService)(req, res, next);
      sinon.assert.calledWith(res.status, 404);
      sinon.assert.calledWith(res.json, sinon.match({
        message: 'Session not found',
        status: 404,
        title: 'Not Found',
      }));
    });

    test('should return InvalidInputError if session user fails validation', async () => {
      const req = { params: { id: 'layoutId' }, session: { personid: -1, name: '' } };
      await layoutOwnerMiddleware(layoutService)(req, res, next);
      sinon.assert.calledWith(res.status, 400);
      sinon.assert.calledWith(res.json, sinon.match({
        message: 'User could not be validated',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should return NotFoundError if layout owner info missing', async () => {
      const req = { params: { id: 'layoutId' }, session: { personid: 1, name: 'Alice' } };
      layoutService.getLayoutById.resolves({ owner: { id: '', name: '' } });

      await layoutOwnerMiddleware(layoutService)(req, res, next);
      sinon.assert.calledWith(res.status, 404);
      sinon.assert.calledWith(res.json, sinon.match({
        message: 'Unable to retrieve layout owner information',
        status: 404,
        title: 'Not Found',
      }));
    });

    test('should return UnauthorizedAccessError if user is not the owner', async () => {
      const req = { params: { id: 'layoutId' }, session: { personid: 2, name: 'Bob' } };
      layoutService.getLayoutById.resolves({ owner: { id: 1, name: 'Alice' } });

      await layoutOwnerMiddleware(layoutService)(req, res, next);
      sinon.assert.calledWith(res.status, 403);
      sinon.assert.calledWith(res.json, sinon.match({
        message: 'Only the owner of the layout can delete it',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });

    test('should call next() if user is the owner', async () => {
      const req = { params: { id: 'layoutId' }, session: { personid: 1, name: 'Alice' } };
      layoutService.getLayoutById.resolves({ owner: { id: 1, name: 'Alice' } });

      await layoutOwnerMiddleware(layoutService)(req, res, next);
      ok(next.called, 'next() should be called for valid owner');
    });
  });
};
