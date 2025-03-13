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

import { suite, test, before, beforeEach } from 'node:test';
import assert, { ok, rejects, strictEqual } from 'node:assert';
import sinon from 'sinon';
import { UserRepository } from '../../../lib/repositories/UserRepository.js';
import { initTest } from '../../setup/testRepositorySetup.js';

/**
 * @typedef {import('../../../lib/services/JsonFileService.js').JsonFileService} JsonFileService
 */

export const userRepositoryTest = async () => {
  suite('User repository tests', () => {
    let jsonFileServiceMock = null;
    let userRepository = null;

    before(async () => {
      const { mockedJsonFileService } = await initTest();
      jsonFileServiceMock = mockedJsonFileService;
      userRepository = new UserRepository(jsonFileServiceMock);
    });

    beforeEach(() => {
      jsonFileServiceMock.writeToFile.resetHistory();
    });

    test('should initialize userRepository successfully', () => {
      ok(userRepository);
    });

    test('should not create a user if the user already exists', async () => {
      const existingUser = {
        id: 0,
        name: 'Anonymous',
        username: 'anonymous',
      };

      await userRepository.createUser(existingUser);

      sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
    });

    test('should throw an error if user object is not provided', () => rejects(
      userRepository.createUser(undefined),
      (err) => err instanceof Error && err.message === 'User Object is mandatory',
    ).then(() => {
      sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
    }));

    test('should throw an error if username is not provided', () => {
      const invalidUser = { id: 4, name: 'test' };
      return rejects(
        userRepository.createUser(invalidUser),
        (err) => err instanceof Error && err.message === 'Field username is mandatory',
      ).then(() => {
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      });
    });

    test('should throw an error if name is not provided', () => {
      const userWithoutName = { id: 1, username: 'test' };
      return rejects(
        userRepository.createUser(userWithoutName),
        (err) => err instanceof Error && err.message === 'Field name is mandatory',
      ).then(() => {
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      });
    });

    test('should throw an error if id is not provided', () => {
      const userWithoutId = { name: 'Test user', username: 'user1' };
      return rejects(
        userRepository.createUser(userWithoutId),
        (err) => err instanceof Error && err.message === 'Field id is mandatory',
      ).then(() => {
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      });
    });

    test('should throw an error if id is not a number', () => {
      const userWithInvalidId = { id: 'abc', name: 'Test user', username: 'user1' };
      return rejects(
        userRepository.createUser(userWithInvalidId),
        (err) => err instanceof Error && err.message === 'Field id must be a number',
      ).then(() => {
        sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      });
    });

    test('should create a new user if the user does not exist', async () => {
      const newUser = { id: 2, name: 'Test User 2', username: 'user2' };
      await userRepository.createUser(newUser);

      const addedUser = jsonFileServiceMock.data.users.find((user) => user.id === newUser.id);
      assert(addedUser, 'New user should be added');
      strictEqual(addedUser.name, newUser.name, 'User name should match');
      strictEqual(addedUser.username, newUser.username, 'Username should match');
      sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
    });
  });
};
