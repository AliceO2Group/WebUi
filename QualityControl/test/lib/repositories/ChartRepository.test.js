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
import { strictEqual, throws } from 'node:assert';
import { ChartRepository } from '../../../lib/repositories/ChartRepository.js';

import { initTest } from '../../setup/testRepositorySetup.js';

/**
 * @typedef {import('../../../lib/services/JsonFileService.js').JsonFileService} JsonFileService
 */

export const chartRepositoryTest = async () => {
  suite('Chart repository tests', () => {
    let jsonFileServiceMock = null;
    let chartRepository = null;

    before(async () => {
      const { mockedJsonFileService } = await initTest();
      jsonFileServiceMock = mockedJsonFileService;
      chartRepository = new ChartRepository(jsonFileServiceMock);
    });

    beforeEach(() => {
      jsonFileServiceMock.writeToFile.resetHistory();
    });

    suite('getObjectById', async () => {
      test('should return the correct object and layout name when the id exists', () => {
        const result = chartRepository.getObjectById('671b8c25d5b49dbf80e81926');
        strictEqual(result.object.id, '671b8c25d5b49dbf80e81926');
        strictEqual(result.object.name, 'qc/MCH/QO/Aggregator/MCHQuality');
        strictEqual(result.layoutName, 'test');
        strictEqual(result.tabName, 'main');
      });

      test('should throw an error when the id does not exist', () => {
        throws(() => chartRepository.getObjectById('3'), new Error('Object with 3 could not be found'));
      });

      test('should throw an error when the id is missing', () => {
        throws(() => chartRepository.getObjectById(), new Error('Missing mandatory parameter: id'));
      });
    });
  });
};
