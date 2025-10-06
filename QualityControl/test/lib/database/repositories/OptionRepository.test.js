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
import { ok, strictEqual } from 'node:assert';
import { stub } from 'sinon';
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
        findOne: stub(),
      };
      optionRepository = new OptionRepository(mockOptionModel);
    });

    test('should create instance with option model', () => {
      ok(optionRepository instanceof OptionRepository);
    });

    test('should find option by name', async () => {
      const optionName = 'testOption';
      const mockOption = { id: 1, name: optionName, type: 'testType' };
      mockOptionModel.findOne.resolves(mockOption);
      const result = await optionRepository.findOptionByName(optionName);
      strictEqual(result, mockOption);
    });

    test('should return null if option not found', async () => {
      const optionName = 'nonExistentOption';
      mockOptionModel.findOne.resolves(null);
      const result = await optionRepository.findOptionByName(optionName);
      strictEqual(result, null);
    });
  });
};
