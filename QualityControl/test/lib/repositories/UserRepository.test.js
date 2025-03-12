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
import { deepStrictEqual, ok, rejects } from 'node:assert';
import sinon from 'sinon';
import { UserRepository } from '../../../lib/repositories/UserRepository.js';

/**
 * @typedef {import('../../../lib/services/JsonFileService.js').JsonFileService} JsonFileService
 */

export const userRepositoryTest = async () => {
  suite('User repository tests', () => {
    /**
     * @type {JsonFileService}
     */
    let jsonFileServiceMock = null;

    /**
     * @type {UserRepository}
     */
    let userRepository = null;

    const mockedUsers = [
      { id: 1, name: 'Test user 1', username: 'user1' },
      { id: 2, name: 'Test user 2', username: 'user2' },
    ];

    before(async () => {
      jsonFileServiceMock = {
        data: {
          users: [...mockedUsers],
        },
        writeToFile: sinon.stub().resolves(),
      };
      userRepository = new UserRepository(jsonFileServiceMock);
    });

    beforeEach(() => {
      jsonFileServiceMock.writeToFile.resetHistory();
    });

    test('should initialize userRepository successfully', () => {
      ok(userRepository);
    });

    test('should not create a user if the user already exists', async () => {
      const existingUser = { id: 1, name: 'Test user 1', username: 'test' };

      await userRepository.createUser(existingUser);

      sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      deepStrictEqual(jsonFileServiceMock.data.users, mockedUsers);
    });

    test('should throw an error if user object is not provided', () => {
      rejects(
        userRepository.createUser(undefined),
        (err) => err instanceof Error && err.message === 'User Object is mandatory',
      );
      sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
      deepStrictEqual(jsonFileServiceMock.data.users, mockedUsers);
    });

    test('should throw an error if username is not provided', () => {
      const invalidUser = { id: 4, name: 'Dave' };
      rejects(
        userRepository.createUser(invalidUser),
        (err) => err instanceof Error && err.message === 'Field username is mandatory',
      );
      deepStrictEqual(jsonFileServiceMock.data.users, mockedUsers);
      sinon.assert.notCalled(jsonFileServiceMock.writeToFile);
    });

    test('should throw an error if name is not provided', () => {
      const userWithoutName = { id: 1, username: 'user1' };
      rejects(
        userRepository.createUser(userWithoutName),
        (err) => err instanceof Error && err.message === 'Field name is mandatory',
      );
    });

    test('should throw an error if id is not provided', () => {
      const userWithoutId = { name: 'Test user', username: 'user1' };
      rejects(
        userRepository.createUser(userWithoutId),
        (err) => err instanceof Error && err.message === 'Field id is mandatory',
      );
    });

    test('should throw an error if id is not a number', () => {
      const userWithInvalidId = { id: 'abc', name: 'Test user', username: 'user1' };
      rejects(
        userRepository.createUser(userWithInvalidId),
        (err) => err instanceof Error && err.message === 'Field id must be a number',
      );
    });

    test('should create a new user if the user does not exist', async () => {
      const newUser = { id: 3, name: 'Test User 3', username: 'user3' };
      await userRepository.createUser(newUser);

      deepStrictEqual(jsonFileServiceMock.data.users, [
        ...mockedUsers,
        newUser,
      ]);
      sinon.assert.calledOnce(jsonFileServiceMock.writeToFile);
    });
  });
};
