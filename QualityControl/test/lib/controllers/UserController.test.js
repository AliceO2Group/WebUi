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
      createNewUser: sinon.stub().resolves(),
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

  suite('constructor', () => {
    test('should throw an error if UserService is not provided', () => {
      try {
        new UserController();
      } catch (err) {
        ok(err instanceof Error);
        ok(err.message === 'Missing User Service');
      }
    });
    test('should create an instance of UserController when UserService is provided', () => {
      const controller = new UserController(userServiceMock);
      ok(controller instanceof UserController);
    });
  });
  suite('addUserHandler', () => {
    test('should call createNewUser of UserService with correct parameters', async () => {
      await userController.addUserHandler(reqMock, resMock);
      ok(userServiceMock.createNewUser.calledOnce);
      ok(userServiceMock.createNewUser.calledWith({
        id: 123,
        name: 'Test User',
        username: 'testuser',
      }));
      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith({ ok: true }));
    });
    //502 if userService fails
    test('should respond with 502 if UserService.createNewUser throws an error', async () => {
      userServiceMock.createNewUser.rejects(new Error('DB error'));
      await userController.addUserHandler(reqMock, resMock);
      ok(resMock.status.calledWith(502));
      ok(resMock.json.calledWith({ ok: false, message: 'Unable to add user to memory' }));
    });
  });
};
