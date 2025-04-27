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

import test, { afterEach, beforeEach, suite } from 'node:test';
import { UserController } from '../../../lib/controllers/UserController.js';
import sinon from 'sinon';
import { ok } from 'node:assert';

export const userControllerTestSuite = async () => {
  let userServiceMock = null;
  let userController = null;
  let reqMock = null;
  let resMock = null;

  beforeEach(() => {
    userServiceMock = {
      createUser: sinon.stub().resolves(),
    };
    userController = new UserController(userServiceMock);
    reqMock = {
      session: {
        personid: 123,
        name: 'Test User',
        username: 'testuser',
      },
    };
    resMock = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('addUserHandler', () => {
    test('should add a user successfully', async () => {
      await userController.addUserHandler(reqMock, resMock);

      ok(userServiceMock.createUser.calledOnce);
      ok(userServiceMock.createUser.calledWith(reqMock.session));
      ok(resMock.status.calledWith(201));
      ok(resMock.json.calledWith({ ok: true }));
    });

    test('should handle errors during user creation', async () => {
      const error = new Error('User creation failed');
      userServiceMock.createUser.rejects(error);

      await userController.addUserHandler(reqMock, resMock);
      ok(resMock.status.calledWith(500));
      ok(resMock.json.calledWith({
        message: 'User creation failed',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });
};
