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

import { strictEqual, rejects } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';

import { UserService } from '../../../../lib/services/layout/UserService.js';
import { NotFoundError } from '@aliceo2/web-ui';

export const userServiceTestSuite = async () => {
  suite('UserService Test Suite', () => {
    let mockUserRepository = null;
    let userService = null;

    beforeEach(() => {
      mockUserRepository = {
        findOne: () => Promise.resolve(null),
        createUser: () => Promise.resolve({ id: 1, username: 'testuser', name: 'Test User' }),
        findById: () => Promise.resolve({ id: 1, username: 'testuser', name: 'Test User' }),
      };

      userService = new UserService(mockUserRepository);
    });

    suite('Constructor', () => {
      test('should successfully initialize UserService', () => {
        const userRepo = { test: 'userRepo' };
        const service = new UserService(userRepo);

        strictEqual(service._userRepository, userRepo);
      });
    });

    suite('saveUser()', () => {
      test('should create new user when user does not exist', async () => {
        const userData = { username: 'newuser', name: 'New User', personid: 123 };
        const createdUsers = [];

        mockUserRepository.findOne = () => Promise.resolve(null);
        mockUserRepository.createUser = (user) => {
          createdUsers.push(user);
          return Promise.resolve(user);
        };

        await userService.saveUser(userData);

        strictEqual(createdUsers.length, 1);
        strictEqual(createdUsers[0].id, 123);
        strictEqual(createdUsers[0].username, 'newuser');
        strictEqual(createdUsers[0].name, 'New User');
      });

      test('should not create user when user already exists', async () => {
        const userData = { username: 'existinguser', name: 'Existing User', personid: 123 };
        let createUserCalled = false;

        mockUserRepository.findOne = () => Promise.resolve({ id: 123, username: 'existinguser' });
        mockUserRepository.createUser = () => {
          createUserCalled = true;
          return Promise.resolve();
        };

        await userService.saveUser(userData);

        strictEqual(createUserCalled, false, 'Should not create user when already exists');
      });

      test('should throw error if createUser returns null', async () => {
        const userData = { username: 'newuser', name: 'New User', personid: 123 };

        mockUserRepository.findOne = () => Promise.resolve(null);
        mockUserRepository.createUser = () => Promise.resolve(null);

        await rejects(
          async () => await userService.saveUser(userData),
          /Error creating user/,
        );
      });

      test('should throw error if repository throws', async () => {
        const userData = { username: 'newuser', name: 'New User', personid: 123 };

        mockUserRepository.findOne = () => Promise.reject(new Error('DB error'));

        await rejects(
          async () => await userService.saveUser(userData),
          /DB error/,
        );
      });
    });

    suite('getUsernameById()', () => {
      test('should return username when user is found', async () => {
        const mockUser = { id: 123, username: 'testuser', name: 'Test User' };
        mockUserRepository.findById = () => Promise.resolve(mockUser);

        const result = await userService.getUsernameById(123);
        strictEqual(result, 'testuser');
      });

      test('should throw NotFoundError when user is not found', async () => {
        mockUserRepository.findById = () => Promise.resolve(null);

        await rejects(
          async () => await userService.getUsernameById(999),
          new NotFoundError('User with ID 999 not found'),
        );
      });

      test('should throw NotFoundError when user has no username', async () => {
        const mockUser = { id: 123, name: 'Test User' };
        mockUserRepository.findById = () => Promise.resolve(mockUser);

        await rejects(
          async () => await userService.getUsernameById(123),
          new NotFoundError('User with ID 123 not found'),
        );
      });
    });

    suite('getOwnerIdByUsername()', () => {
      test('should return user id when user is found', async () => {
        const mockUser = { id: 123, username: 'testuser', name: 'Test User' };
        mockUserRepository.findOne = () => Promise.resolve(mockUser);

        const result = await userService.getOwnerIdByUsername('testuser');
        strictEqual(result, 123);
      });

      test('should throw NotFoundError when user is not found', async () => {
        mockUserRepository.findOne = () => Promise.resolve(null);

        await rejects(
          async () => await userService.getOwnerIdByUsername('nonexistent'),
          /User with username nonexistent not found/,
        );
      });
    });
  });
};
