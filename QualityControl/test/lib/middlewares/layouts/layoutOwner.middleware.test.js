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
import { JsonFileService } from '../../../../lib/services/JsonFileService.js';
import { layoutOwnerMiddleware } from '../../../../lib/middleware/layouts/layoutOwner.middleware.js';

/**
 * Test suite for the middleware that checks the owner of the layout
 */
export const layoutOwnerMiddlewareTest = () => {
  suite('Layout owner middleware', () => {
    test('should return an "UnauthorizedAccessError" if the layout does not belong to the user', async () => {
      const req = {
        params: {
          id: 'layoutId',
        },
        session: {
          personid: 'notTheOwnerId',
          name: 'notTheOwnerName',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      const dataServiceStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves({ owner_name: 'ownerName', owner_id: 'ownerId' }),
      });
      await layoutOwnerMiddleware(dataServiceStub)(req, res, next);
      ok(res.status.calledWith(403));
      ok(res.json.calledWith({
        message: 'Only the owner of the layout can delete it',
        status: 403,
        title: 'Unauthorized Access',
      }));
    });
    test('should return an "NotFound" error if the owner data of the layout is not accesible', async () => {
      const req = {
        params: {
          id: 'layoutId',
        },
        session: {
          personid: 'ownerId',
          name: 'ownerName',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      const dataServiceStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().returns(),
      });
      await layoutOwnerMiddleware(dataServiceStub)(req, res, next);
      ok(res.status.calledWith(404));
      ok(res.json.calledWith({
        message: 'Unable to retrieve layout owner information',
        status: 404,
        title: 'Not Found',
      }));
    });
    test('should return an "NotFound" error if the session information is not accesible', async () => {
      const req = {
        params: {
          id: 'layoutId',
        },
        session: {
          personid: '',
          name: '',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returns(),
      };
      const next = sinon.stub().returns();
      const dataServiceStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().returns({ owner_name: 'ownerName', owner_id: 'ownerId' }),
      });
      await layoutOwnerMiddleware(dataServiceStub)(req, res, next);
      ok(res.status.calledWith(404));
      ok(res.json.calledWith({
        message: 'Unable to retrieve session information',
        status: 404,
        title: 'Not Found',
      }));
    });

    test('should successfully pass the check if the layout belongs to the user', async () => {
      const req = {
        params: {
          id: 'layoutId',
        },
        session: {
          personid: 'ownerId',
          name: 'ownerName',
        },
      };
      const next = sinon.stub().returns();
      const dataServiceStub = sinon.createStubInstance(JsonFileService, {
        readLayout: sinon.stub().resolves({ owner_name: 'ownerName', owner_id: 'ownerId' }),
      });
      await layoutOwnerMiddleware(dataServiceStub)(req, {}, next);
      ok(next.called, 'The next() callback should be called');
    });
  });
};
