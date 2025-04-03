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

import { ok, rejects } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { LogManager } from '@aliceo2/web-ui';
import { UserRepository } from '../../../../lib/database/repositories/UserRepository.js';

export const userRepositoryTestSuite = async () => {
  let userModelMock = null;
  let loggerMock = null;
  let repository = null;

  beforeEach(() => {
    userModelMock = {
      findByPk: sinon.stub(),
      findOne: sinon.stub(),
      create: sinon.stub(),
    };
    loggerMock = { errorMessage: sinon.stub() };

    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }
    repository = new UserRepository(userModelMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('findUserById', () => {
    test('should return the user when found', async () => {
      const userId = '123';
      const user = { id: userId, username: 'john_doe' };
      userModelMock.findByPk.resolves(user);

      const result = await repository.findUserById(userId);

      ok(result === user);
      ok(userModelMock.findByPk.calledWith(userId));
    });

    test('should return null when the user is not found', async () => {
      const userId = '123';
      userModelMock.findByPk.resolves(null);

      const result = await repository.findUserById(userId);

      ok(result === null);
    });

    test('should log an error if an exception occurs', async () => {
      const userId = '123';
      const error = new Error('Database error');
      userModelMock.findByPk.rejects(error);

      await rejects(
        async () => await repository.findUserById(userId),
        error,
      );
    });
  });

  suite('findUser', () => {
    test('should return the user when found based on filters', async () => {
      const filters = { username: 'john_doe' };
      const user = { id: '123', username: 'john_doe' };
      userModelMock.findOne.resolves(user);

      const result = await repository.findUser(filters);

      ok(result === user);
      ok(userModelMock.findOne.calledWith({ where: filters }));
    });

    test('should return null if the user is not found', async () => {
      const filters = { username: 'non_existent_user' };
      userModelMock.findOne.resolves(null);

      const result = await repository.findUser(filters);

      ok(result === null);
    });

    test('should log an error if an exception occurs', async () => {
      const filters = { username: 'john_doe' };
      const error = new Error('Database error');
      userModelMock.findOne.rejects(error);

      await rejects(
        async () => await repository.findUser(filters),
        error,
      );
    });
  });

  suite('createUser', () => {
    test('should save the user and return the created user', async () => {
      const userData = { username: 'john_doe', email: 'john.doe@example.com' };
      const createdUser = { id: '123', ...userData };
      userModelMock.create.resolves(createdUser);

      const result = await repository.createUser(userData);

      ok(result === createdUser);
      ok(userModelMock.create.calledWith(userData));
    });

    test('should throw an error if creation fails', async () => {
      const userData = { username: 'john_doe', email: 'john.doe@example.com' };
      const error = new Error('Database error');
      userModelMock.create.rejects(error);

      await rejects(
        async () => await repository.createUser(userData),
        error,
      );
    });
  });
};
