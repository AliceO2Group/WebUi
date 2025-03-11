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
import { NotFoundError } from '@aliceo2/web-ui';
import LayoutRepository from '../../../../lib/repositories/LayoutRepository.js';

/**
 * Test suite for the middlewares involved in the ID check of the layout requests
 */
export const layoutIdMiddlewareTest = () => {
  suite('Layout id middlewares', () => {
    test('should return an "Invalid input" error if the layout id is not provided', () => {
      const req = {
        params: {
          id: null,
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      const dataServiceStub = sinon.createStubInstance(LayoutRepository);
      layoutIdMiddleware(dataServiceStub)(req, res, next);
      ok(res.status.calledWith(400), 'The status code should be 400');
      ok(res.json.calledWith({
        message: 'The "id" parameter is missing from the request',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should return a "Not found" error if the layout id does not exist', () => {
      const dataServiceStub = sinon.createStubInstance(LayoutRepository, {
        readLayoutById: sinon.stub().throwsException(new NotFoundError('Layout not found')),
      });
      const req = {
        params: {
          id: 'nonExistingId',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      layoutIdMiddleware(dataServiceStub)(req, res, next);
      ok(res.status.calledWith(404));
      ok(res.json.calledWith({
        message: 'Layout not found',
        status: 404,
        title: 'Not Found',
      }));
    });

    test('should successfully pass the check if the layout id is provided and exists', async () => {
      const req = {
        params: {
          id: 'layoutId',
        },
      };
      const next = sinon.stub().returns();
      const dataServiceStub = sinon.createStubInstance(LayoutRepository, {
        readLayoutById: sinon.stub().resolves({}),
      });
      await layoutIdMiddleware(dataServiceStub)(req, {}, next);
      ok(next.called, 'It should call the next middleware');
    });
  });
};
