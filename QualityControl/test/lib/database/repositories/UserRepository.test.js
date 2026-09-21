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

import { suite, test } from 'node:test';
import { ok, strictEqual } from 'node:assert';
import { UserRepository } from '../../../../lib/database/repositories/UserRepository.js';

/**
 * Test suite for UserRepository
 */
export const userRepositoryTestSuite = () => {
  suite('UserRepository', () => {
    const users = [];
    const mockUserModel = {
      name: 'User',
      create: async (user) => {
        users.push(user); return user;
      },
    };
    const userRepository = new UserRepository(mockUserModel);

    test('should create instance with user model', () => {
      ok(userRepository instanceof UserRepository);
      strictEqual(userRepository.model, mockUserModel);
    });

    test('should create a new user', async () => {
      const newUser = { id: 1, name: 'Alice', username: 'alice' };
      await userRepository.createUser(newUser);
      strictEqual(users.length, 1);
      strictEqual(users[0], newUser);
    });
  });
};
