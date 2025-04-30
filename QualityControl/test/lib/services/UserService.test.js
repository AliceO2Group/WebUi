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
import { deepEqual, ok, rejects } from 'node:assert';
import { suite, test, afterEach, beforeEach } from 'node:test';
import { UserService } from '../../../lib/services/UserService.js';
import { InvalidInputError } from '@aliceo2/web-ui';

export const userServiceTestSuite = async () => {
  suite('UserService', () => {
    let userRepositoryMock = null;
    let userService = null;

    beforeEach(() => {
      // Mock the user repository methods
      userRepositoryMock = {
        findUserByUsername: stub(),
        findUserById: stub(),
        findUser: stub(),
        createUser: stub(),
      };

      // Create an instance of the UserService with the mock repository
      userService = new UserService(userRepositoryMock);
    });

    afterEach(() => {
      restore(); // Restore all stubs after each test
    });

    suite('getUserByUsername', () => {
      test('should return user if found', async () => {
        const mockUser = {
          id: 1, username: 'testuser', name: 'Test User', toJSON: () => ({ id: 1, username: 'testuser' }) };
        userRepositoryMock.findUserByUsername.resolves(mockUser);

        const result = await userService.getUserByUsername('testuser');
        deepEqual(result, { id: 1, username: 'testuser' });

        ok(userRepositoryMock.findUserByUsername.calledWith('testuser'));
      });

      test('should return null if user not found', async () => {
        userRepositoryMock.findUserByUsername.resolves(null);

        const result = await userService.getUserByUsername('testuser');
        deepEqual(result, null);

        ok(userRepositoryMock.findUserByUsername.calledWith('testuser'));
      });

      test('should throw error if findUserByUsername fails', async () => {
        const error = new Error('Database error');
        userRepositoryMock.findUserByUsername.rejects(error);

        await rejects(
          async () => await userService.getUserByUsername('testuser'),
          error,
        );
      });
    });

    suite('getUserById', () => {
      test('should return user if found', async () => {
        const mockUser = {
          id: 1, username: 'testuser', name: 'Test User', toJSON: () => ({ id: 1, username: 'testuser' }) };
        userRepositoryMock.findUserById.resolves(mockUser);

        const result = await userService.getUserById(1);
        deepEqual(result, { id: 1, username: 'testuser' });

        ok(userRepositoryMock.findUserById.calledWith(1));
      });

      test('should return null if user not found', async () => {
        userRepositoryMock.findUserById.resolves(null);

        const result = await userService.getUserById(1);
        deepEqual(result, null);

        ok(userRepositoryMock.findUserById.calledWith(1));
      });

      test('should throw error if findUserById fails', async () => {
        const error = new Error('Database error');
        userRepositoryMock.findUserById.rejects(error);

        await rejects(
          async () => await userService.getUserById(1),
          error,
        );
      });
    });

    suite('createUser', () => {
      test('should create a new user if valid data', async () => {
        const sessionInfo = { personid: 1, username: 'newuser', name: 'New User' };
        userRepositoryMock.findUser.resolves([]);

        await userService.createUser(sessionInfo);

        ok(userRepositoryMock.createUser.calledOnce);
        ok(userRepositoryMock.createUser.calledWith({
          id: sessionInfo.personid,
          username: sessionInfo.username,
          name: sessionInfo.name,
        }));
      });

      test('should do nothing if user already exists', async () => {
        const sessionInfo = { personid: 1, username: 'existinguser', name: 'Existing User' };
        userRepositoryMock.findUser.resolves({ id: 1, username: 'existinguser', name: 'Existing User' });

        await userService.createUser(sessionInfo);

        ok(userRepositoryMock.createUser.notCalled);
      });

      test('should throw error if validation fails', async () => {
        const sessionInfo = { username: 'invaliduser' };

        await rejects(
          async () => await userService.createUser(sessionInfo),
          new InvalidInputError('name of the user is mandatory'),
        );
      });

      test('should throw error if createUser fails', async () => {
        const sessionInfo = { personid: 1, username: 'newuser', name: 'New User' };
        userRepositoryMock.findUser.resolves([]);
        userRepositoryMock.createUser.rejects(new Error('Database error'));

        await rejects(
          async () => await userService.createUser(sessionInfo),
          new Error('Database error'),
        );
      });
    });

    suite('_validateUser', () => {
      test('should throw error if sessionInfo is missing', async () => {
        await rejects(
          async () => await userService._validateUser(null),
          new InvalidInputError('sessionInfo must be provided'),
        );
      });

      test('should throw error if username is missing', async () => {
        const sessionInfo = { name: 'User', personid: 1 };

        await rejects(
          async () => await userService._validateUser(sessionInfo),
          new InvalidInputError('Field "username" is mandatory.'),
        );
      });

      test('should throw error if name is missing', async () => {
        const sessionInfo = { username: 'newuser', personid: 1 };

        await rejects(
          async () => await userService._validateUser(sessionInfo),
          new InvalidInputError('name of the user is mandatory'),
        );
      });

      test('should throw error if personid is missing or invalid', async () => {
        const sessionInfo = { username: 'newuser', name: 'User', personid: null };

        await rejects(
          async () => await userService._validateUser(sessionInfo),
          new InvalidInputError('id of the user is mandatory'),
        );
      });

      test('should throw error if personid is not a number', async () => {
        const sessionInfo = { username: 'newuser', name: 'User', personid: 'string' };

        await rejects(
          async () => await userService._validateUser(sessionInfo),
          new InvalidInputError('id of the user must be a number'),
        );
      });
    });
  });
};
