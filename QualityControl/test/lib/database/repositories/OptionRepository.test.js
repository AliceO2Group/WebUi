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

import { ok, rejects } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { LogManager } from '@aliceo2/web-ui';
import { OptionRepository } from '../../../../lib/database/repositories/OptionRepository.js';

export const optionRepositoryTestSuite = async () => {
  let optionModelMock = null;
  let loggerMock = null;
  let repository = null;

  beforeEach(() => {
    optionModelMock = {
      findAll: sinon.stub(),
    };
    loggerMock = { errorMessage: sinon.stub() };

    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }

    repository = new OptionRepository(optionModelMock);
    repository._logger = loggerMock;
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('constructor', () => {
    test('should initialize with the correct model', () => {
      ok(repository._model === optionModelMock);
    });
  });

  suite('findAll', () => {
    test('should return all options', async () => {
      const options = [{ id: 1, name: 'Option 1' }, { id: 2, name: 'Option 2' }];
      optionModelMock.findAll.resolves(options);

      const result = await repository.findAll();
      ok(result === options);
      ok(optionModelMock.findAll.calledOnce);
    });

    test('should log an error and throw if retrieval fails', async () => {
      const error = new Error('Database error');
      optionModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findAll(),
        new Error('Failed to retrieve options'),
      );
    });
  });
};
