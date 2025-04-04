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
import { LayoutService } from '../../../../lib/services/LayoutService.js';
import { layoutServiceMiddleware } from '../../../../lib/middleware/layouts/layoutService.middleware.js';

/**
 * Test suite for the middlewares that check the layout service is correctly initialized
 */
export const layoutServiceMiddlewareTest = () => {
  suite('Layout service middlewares', () => {
    test('should return a "Service Unavailable" error if the Layout Service is not provided', () => {
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      layoutServiceMiddleware(null)({}, res, next);
      ok(res.status.calledWith(503), 'The status code should be 503');
      ok(res.json.calledWith({
        message: 'Layout service is not available',
        status: 503,
        title: 'Service Unavailable',
      }));
    });

    test(
      'should return a "Service Unavailable" error if the Layout Service is not an instance of Layout service',
      () => {
        const res = {
          status: sinon.stub().returnsThis(),
          json: sinon.stub().returns(),
        };
        const next = sinon.stub().returns();
        const dataService = 'notAlayoutService';
        layoutServiceMiddleware(dataService)({}, res, next);
        ok(res.status.calledWith(503), 'The status code should be 503');
        ok(res.json.calledWith({
          message: 'Layout service is not available',
          status: 503,
          title: 'Service Unavailable',
        }));
      },
    );

    test(
      'should successfully pass the middleware if the Layout Service is provided',
      () => {
        const next = sinon.stub().returns();
        const dataServiceStub = sinon.createStubInstance(LayoutService);
        layoutServiceMiddleware(dataServiceStub)({}, {}, next);
        ok(next.calledOnce, 'The next middleware should be called');
      },
    );
  });
};
