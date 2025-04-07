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
import { statusComponentMiddleware } from '../../../../lib/middleware/status/statusComponent.middleware.js';

/**
 * Test suite for the middlewares involved in the check for queried service being valid or not
 */
export const statusComponentMiddlewareTest = () => {
  suite('Status component middlewares', () => {
    test('should return an "Invalid input" error if no component is provided', () => {
      const req = {
        params: {},
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      statusComponentMiddleware(req, res, next);
      ok(res.status.calledWith(400), 'Status code is not 400');
      ok(res.json.calledWith({
        message: 'Component parameter is missing',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should return an "Invalid input" error if provided component is not valid', () => {
      const req = {
        params: {
          service: 'test',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      statusComponentMiddleware(req, res, next);
      ok(res.status.calledWith(400), 'Status code is not 400');
      ok(res.json.calledWith({
        message: 'Invalid component parameter',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should successfully pass the check if the component provided is valid', () => {
      const req = {
        params: {
          service: 'qcg',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      statusComponentMiddleware(req, res, next);
      ok(next.called, 'It should call the next middleware');
    });
  });
};
