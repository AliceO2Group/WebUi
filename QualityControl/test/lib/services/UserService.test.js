/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { stub, restore } from 'sinon';
import { deepEqual, ok, rejects, strictEqual, throws } from 'node:assert';
import { suite, test, afterEach, beforeEach } from 'node:test';
import { UserService } from '../../../lib/services/UserService.js';
import { InvalidInputError } from '@aliceo2/web-ui';

export const userServiceTestSuite = async () => {
  suite('User Service Test Suite', () => {
    let userRepositoryMock = null;
    let userService = null;

    beforeEach(() => {
      userRepositoryMock = {
        findUserByUsername: stub(),
        findUserById: stub(),
        findUser: stub(),
        createUser: stub(),
      };
      userService = new UserService(userRepositoryMock);
    });

    afterEach(() => {
      restore();
    });

    suite('Constructor', () => {
      test('should throw an error if userRepository is not provided', () => {
        throws(() => new UserService(null), new Error('Missing User Repository'));
      });
    });

    suite('getUserByUsername', () => {
      test('should return user as JSON if user is found', async () => {
        const fakeUser = { toJSON: () => ({ username: 'testuser' }) };
        userRepositoryMock.findUserByUsername.resolves(fakeUser);

        const result = await userService.getUserByUsername('testuser');
        deepEqual(result, { username: 'testuser' });
      });

      test('should return null if user is not found', async () => {
        userRepositoryMock.findUserByUsername.resolves(null);

        const result = await userService.getUserByUsername('notfound');
        strictEqual(result, null);
      });

      test('should throw an error if repository throws', async () => {
        userRepositoryMock.findUserByUsername.rejects(new Error('Database error'));

        await rejects(
          () => userService.getUserByUsername('fail'),
          (error) => {
            strictEqual(error.message, 'Error getting user by username: Database error');
            return true;
          },
        );
      });
    });

    suite('getUserById', () => {
      test('should return user as JSON if user is found', async () => {
        const fakeUser = { toJSON: () => ({ id: 1 }) };
        userRepositoryMock.findUserById.resolves(fakeUser);

        const result = await userService.getUserById(1);
        deepEqual(result, { id: 1 });
      });

      test('should return null if user is not found', async () => {
        userRepositoryMock.findUserById.resolves(null);

        const result = await userService.getUserById(999);
        strictEqual(result, null);
      });

      test('should throw an error if repository throws', async () => {
        userRepositoryMock.findUserById.rejects(new Error('Database error'));

        await rejects(
          () => userService.getUserById(1),
          (error) => {
            strictEqual(error.message, 'Error getting user by ID: Database error');
            return true;
          },
        );
      });
    });

    suite('createUser', () => {
      test('should create a new user if user does not exist', async () => {
        const sessionInfo = { username: 'newuser', name: 'New User', personid: 2 };
        userRepositoryMock.findUser.resolves([]);
        userRepositoryMock.createUser.resolves();

        await userService.createUser(sessionInfo);

        ok(userRepositoryMock.createUser.calledOnce);
        deepEqual(userRepositoryMock.createUser.firstCall.args[0], {
          id: 2,
          username: 'newuser',
          name: 'New User',
        });
      });

      test('should not create a user if user already exists', async () => {
        const sessionInfo = { username: 'existinguser', name: 'Existing User', personid: 3 };
        userRepositoryMock.findUser.resolves([{ id: 3 }]);

        await userService.createUser(sessionInfo);

        strictEqual(userRepositoryMock.createUser.called, false);
      });

      test('should throw validation error if sessionInfo is invalid', async () => {
        await rejects(
          () => userService.createUser({}),
          (error) => {
            ok(error instanceof InvalidInputError);
            return true;
          },
        );
      });
    });

    suite('_validateUser', () => {
      test('should throw if sessionInfo is not provided', () => {
        try {
          userService._validateUser(null);
        } catch (error) {
          ok(error instanceof InvalidInputError);
          strictEqual(error.message, 'sessionInfo must be provided');
        }
      });

      test('should throw if username is missing', () => {
        try {
          userService._validateUser({ name: 'Test', personid: 1 });
        } catch (error) {
          ok(error instanceof InvalidInputError);
          strictEqual(error.message, 'Field "username" is mandatory.');
        }
      });

      test('should throw if name is missing', () => {
        try {
          userService._validateUser({ username: 'test', personid: 1 });
        } catch (error) {
          ok(error instanceof InvalidInputError);
          strictEqual(error.message, 'name of the user is mandatory');
        }
      });

      test('should throw if personid is missing', () => {
        try {
          userService._validateUser({ username: 'test', name: 'Test', personid: '' });
        } catch (error) {
          ok(error instanceof InvalidInputError);
          strictEqual(error.message, 'id of the user is mandatory');
        }
      });

      test('should throw if personid is not a number', () => {
        try {
          userService._validateUser({ username: 'test', name: 'Test', personid: 'abc' });
        } catch (error) {
          ok(error instanceof InvalidInputError);
          strictEqual(error.message, 'id of the user must be a number');
        }
      });
    });
  });
};
