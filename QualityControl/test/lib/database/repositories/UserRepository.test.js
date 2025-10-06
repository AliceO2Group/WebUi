/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { suite, test, beforeEach } from 'node:test';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { stub } from 'sinon';
import { UserRepository } from '../../../../lib/database/repositories/UserRepository.js';

/**
 * Test suite for UserRepository
 */
export const userRepositoryTestSuite = () => {
  suite('UserRepository', () => {
    let mockUserModel = null;
    let userRepository = null;

    beforeEach(() => {
      mockUserModel = {
        name: 'User',
        findAll: stub(),
        findByPk: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
        findOne: stub(),
      };
      userRepository = new UserRepository(mockUserModel);
    });

    test('should create instance with user model', () => {
      ok(userRepository instanceof UserRepository);
      strictEqual(userRepository.model, mockUserModel);
    });

    test('should find user by username', async () => {
      const mockUser = { id: '1', username: 'testuser', name: 'Test User' };
      mockUserModel.findOne.resolves(mockUser);

      const filters = { username: 'testuser' };
      const result = await userRepository.findUser(filters);

      deepStrictEqual(result, mockUser);
      ok(mockUserModel.findOne.calledOnceWith({ where: filters }));
    });

    test('should filter user by id', async () => {
      const mockUser = { id: '1', username: 'testuser', name: 'Test User' };
      mockUserModel.findOne.resolves(mockUser);

      const filters = { id: '1' };
      const result = await userRepository.findUser(filters);

      deepStrictEqual(result, mockUser);
      ok(mockUserModel.findOne.calledOnceWith({ where: filters }));
    });

    test(' should create a new user', async () => {
      const newUser = { username: 'newuser', name: 'New User' };
      const createdUser = { id: '2', ...newUser };
      mockUserModel.create.resolves(createdUser);

      const result = await userRepository.createUser(newUser);

      deepStrictEqual(result, createdUser);
      ok(mockUserModel.create.calledOnceWith(newUser));
    });
  });
};
