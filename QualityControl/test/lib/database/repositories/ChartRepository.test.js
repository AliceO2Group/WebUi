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
import { ChartRepository } from '../../../../lib/database/repositories/ChartRepository.js';

/**
 * Test suite for ChartRepository
 */
export const chartRepositoryTestSuite = () => {
  suite('ChartRepository', () => {
    const mockChartModel = {
      name: 'Chart',
    };
    const chartRepository = new ChartRepository(mockChartModel);

    test('should create instance with chart model', () => {
      ok(chartRepository instanceof ChartRepository);
      strictEqual(chartRepository.model, mockChartModel);
    });
  });
};
