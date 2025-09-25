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
import sinon from 'sinon';
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
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
      };
      userRepository = new UserRepository(mockUserModel);
    });

    test('should create instance with user model', () => {
      ok(userRepository instanceof UserRepository);
      strictEqual(userRepository.model, mockUserModel);
    });

    test('should have createUser method', async () => {
      const userData = { username: 'testuser', name: 'Test User' };
      const createdUser = { id: '1', ...userData };
      mockUserModel.create.resolves(createdUser);

      const result = await userRepository.createUser(userData);
      deepStrictEqual(result, createdUser);
      ok(mockUserModel.create.calledWith(userData));
    });

    test('should inherit from BaseRepository', () => {
      ok(userRepository.model);
    });

    test('should handle user creation with minimal data', async () => {
      const userData = { username: 'minimal' };
      const createdUser = { id: '2', ...userData };
      mockUserModel.create.resolves(createdUser);

      const result = await userRepository.createUser(userData);
      deepStrictEqual(result, createdUser);
    });

    test('should handle model operations', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      mockUserModel.findByPk.resolves(mockUser);

      const result = await userRepository.model.findByPk('1');
      deepStrictEqual(result, mockUser);
      ok(mockUserModel.findByPk.calledWith('1'));
    });
  });
};
