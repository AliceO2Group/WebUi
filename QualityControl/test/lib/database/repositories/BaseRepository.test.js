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
import { strictEqual, deepStrictEqual, ok, throws } from 'node:assert';
import { stub } from 'sinon';
import { BaseRepository } from '../../../../lib/database/repositories/BaseRepository.js';

/**
 * Test suite for BaseRepository
 */
export const baseRepositoryTestSuite = () => {
  suite('BaseRepository', () => {
    let mockModel = null;
    let repository = null;

    beforeEach(() => {
      mockModel = {
        name: 'MockModel',
        findByPk: stub(),
        findOne: stub(),
        findAll: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
      };
      repository = new BaseRepository(mockModel);
    });

    test('should throw an error if no model is provided', () => {
      throws(() => new BaseRepository(), { message: 'A Sequelize model must be provided to BaseRepository.' });
    });

    test('should initialize with the correct model and default include', () => {
      strictEqual(repository.model, mockModel);
      deepStrictEqual(repository.defaultInclude, []);
    });

    test('should allow setting and getting default include', () => {
      const newInclude = [{ model: 'RelatedModel' }];
      repository.defaultInclude = newInclude;
      deepStrictEqual(repository.defaultInclude, newInclude);
    });

    test('should find a record by id', async () => {
      const id = 123;
      const expected = { id, name: 'Test Item' };
      mockModel.findByPk.resolves(expected);

      const result = await repository.findById(id);

      deepStrictEqual(result, expected);
      ok(mockModel.findByPk.calledOnceWithExactly(id, { include: [] }));
    });

    test('should find one record with given constraints', async () => {
      const constraints = { name: 'Alice' };
      const expected = { id: 1, name: 'Alice' };
      mockModel.findOne.resolves(expected);

      const result = await repository.findOne(constraints);

      deepStrictEqual(result, expected);
      ok(mockModel.findOne.calledOnceWithExactly({ where: constraints, include: [] }));
    });

    test('should find all records', async () => {
      const expected = [{ id: 1 }, { id: 2 }];
      mockModel.findAll.resolves(expected);

      const result = await repository.findAll();

      deepStrictEqual(result, expected);
      ok(mockModel.findAll.calledOnceWithExactly({ include: [] }));
    });

    test('should create a new record', async () => {
      const item = { name: 'New Item' };
      const expected = { id: 1, ...item };
      mockModel.create.resolves(expected);

      const result = await repository.create(item);

      deepStrictEqual(result, expected);
      ok(mockModel.create.calledOnceWithExactly(item, {}));
    });

    test('should update a record by id', async () => {
      const id = 5;
      const updateData = { name: 'Updated' };
      mockModel.update.resolves([1]);

      const result = await repository.update(id, updateData);

      deepStrictEqual(result, [1]);
      ok(mockModel.update.calledOnceWithExactly(updateData, { where: { id } }));
    });

    test('should delete a record by id', async () => {
      const id = 10;
      mockModel.destroy.resolves(1);

      const result = await repository.delete(id);

      strictEqual(result, 1);
      ok(mockModel.destroy.calledOnceWithExactly({ where: { id } }));
    });
  });
};
