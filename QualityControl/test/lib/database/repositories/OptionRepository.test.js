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
import { OptionRepository } from '../../../../lib/database/repositories/OptionRepository.js';

/**
 * Test suite for OptionRepository
 */
export const optionRepositoryTestSuite = () => {
  suite('OptionRepository', () => {
    let mockOptionModel = null;
    let optionRepository = null;

    beforeEach(() => {
      mockOptionModel = {
        name: 'Option',
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
        findOrCreate: sinon.stub(),
      };
      optionRepository = new OptionRepository(mockOptionModel);
    });

    test('should create instance with option model', () => {
      ok(optionRepository instanceof OptionRepository);
      strictEqual(optionRepository.model, mockOptionModel);
    });

    test('should inherit from BaseRepository', () => {
      ok(optionRepository.model);
    });

    test('should handle option creation', async () => {
      const optionData = { name: 'color', type: 'string', default_value: 'blue' };
      const createdOption = { id: '1', ...optionData };
      mockOptionModel.create.resolves(createdOption);

      const result = await optionRepository.model.create(optionData);
      deepStrictEqual(result, createdOption);
      ok(mockOptionModel.create.calledWith(optionData));
    });

    test('should handle option retrieval by name', async () => {
      const mockOption = { id: '1', name: 'color', type: 'string', default_value: 'blue' };
      mockOptionModel.findOne.resolves(mockOption);

      const result = await optionRepository.model.findOne({ where: { name: 'color' } });
      deepStrictEqual(result, mockOption);
      ok(mockOptionModel.findOne.calledWith({ where: { name: 'color' } }));
    });

    test('should handle find or create option', async () => {
      const optionData = { name: 'size', type: 'number', default_value: '10' };
      const foundOption = { id: '2', ...optionData };
      mockOptionModel.findOrCreate.resolves([foundOption, false]);

      const result = await optionRepository.model.findOrCreate({ where: { name: 'size' }, defaults: optionData });
      deepStrictEqual(result, [foundOption, false]);
      ok(mockOptionModel.findOrCreate.calledWith({ where: { name: 'size' }, defaults: optionData }));
    });

    test('should handle all options retrieval', async () => {
      const mockOptions = [
        { id: '1', name: 'color', type: 'string', default_value: 'blue' },
        { id: '2', name: 'size', type: 'number', default_value: '10' },
      ];
      mockOptionModel.findAll.resolves(mockOptions);

      const result = await optionRepository.model.findAll();
      deepStrictEqual(result, mockOptions);
      ok(mockOptionModel.findAll.called);
    });

    test('should handle option updates', async () => {
      const updateData = { default_value: 'red' };
      const updateResult = [1];
      mockOptionModel.update.resolves(updateResult);

      const result = await optionRepository.model.update(updateData, { where: { name: 'color' } });
      deepStrictEqual(result, updateResult);
      ok(mockOptionModel.update.calledWith(updateData, { where: { name: 'color' } }));
    });

    test('should handle option deletion', async () => {
      mockOptionModel.destroy.resolves(1);

      const result = await optionRepository.model.destroy({ where: { id: '1' } });
      strictEqual(result, 1);
      ok(mockOptionModel.destroy.calledWith({ where: { id: '1' } }));
    });

    test('should handle option retrieval by type', async () => {
      const mockOptions = [
        { id: '1', name: 'color', type: 'string', default_value: 'blue' },
        { id: '3', name: 'title', type: 'string', default_value: 'Chart' },
      ];
      mockOptionModel.findAll.resolves(mockOptions);

      const result = await optionRepository.model.findAll({ where: { type: 'string' } });
      deepStrictEqual(result, mockOptions);
      ok(mockOptionModel.findAll.calledWith({ where: { type: 'string' } }));
    });
  });
};
