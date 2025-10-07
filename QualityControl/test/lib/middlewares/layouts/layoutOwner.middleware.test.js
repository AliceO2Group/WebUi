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

/**
 * Test suite for the middleware that checks the owner of the layout
 */
export const layoutOwnerMiddlewareTest = () => {
  suite('Layout owner middleware', () => {
    let req = null;
    let res = null;
    let next = null;
    let layoutService = null;
    let userService = null;
    beforeEach(() => {
      req = { params: { id: '1' }, session: { personid: '1', username: 'validUser' } };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
      next = sinon.stub();
      layoutService = {
        getLayoutById: sinon.stub().resolves({ owner_username: 'validUser' }),
      };
      userService = {
        getOwnerIdByUsername: sinon.stub().resolves('1'),
      };
    });
    test('should throw unauthorized if session is missing', async () => {
      req.session = null;
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Unable to retrieve session information',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });
    test('should throw unauthorized if session personid is missing', async () => {
      req.session.personid = '';
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Unable to retrieve session information',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });
    test('should throw unauthorized if session username is missing', async () => {
      req.session.username = '';
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Unable to retrieve session information',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });
    test('should throw not found if layout does not exist', async () => {
      layoutService.getLayoutById = sinon.stub().resolves({
        owner_username: '',
      });
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Unable to retrieve layout owner information',
        status: 404,
        title: 'Not Found',
      }));
    });
    test('should throw not found if owner_id is not found', async () => {
      userService.getOwnerIdByUsername = sinon.stub().resolves('');
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Unable to retrieve layout owner information',
        status: 404,
        title: 'Not Found',
      }));
    });
    test('should throw unauthorized if session personid does not match owner_id', async () => {
      userService.getOwnerIdByUsername = sinon.stub().resolves('2');
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Only the owner of the layout can make changes to this layout',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });
    test('should throw unauthorized if session username does not match owner_username', async () => {
      layoutService.getLayoutById = sinon.stub().resolves({
        owner_username: 'invalidUser',
      });
      await layoutOwnerMiddleware(layoutService, userService)(req, res, next);
      ok(res.json.called);
      ok(res.json.calledWith({
        message: 'Only the owner of the layout can make changes to this layout',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });
  });
};
