/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { AssertionError, deepStrictEqual, throws } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import { FilterService } from '../../../lib/services/FilterService.js';
import { stub, restore } from 'sinon';

export const filterServiceTestSuite = async () => {
  let filterService = null;
  let bookkeepingServiceMock = null;

  beforeEach(() => {
    bookkeepingServiceMock = {
      connect: stub(),
      retrieveRunTypes: stub(),
      active: true, // assume the bookkeeping service is active by default
    };
  });

  afterEach(() => {
    restore();
  });

  suite('should create a new instance of FilterService', async () => {
    test('should throw an error if BookkeepingService is not defined', () => {
      throws(
        () => new FilterService(undefined),
        new AssertionError({ message: 'Bookkeeping Service is required', expected: true, operator: '==' }),
      );
    });
    test('should initialize _runTypes as empty array', () => {
      filterService = new FilterService(bookkeepingServiceMock);
      deepStrictEqual(filterService.runTypes, []);
    });
  });

  suite('should get the run types', () => {
    test('should throw an error if cannot retrieve run types from bookkeeping', async () => {
      const error = new Error('Failed to fetch run types');
      bookkeepingServiceMock.retrieveRunTypes.rejects(error);
      filterService = new FilterService(bookkeepingServiceMock);

      await filterService.getRunTypes();

      deepStrictEqual(filterService.runTypes, []);
    });

    test('should return the run types sorted by name', async () => {
      const mockRunTypes = [
        { name: 'Beta' },
        { name: 'Alpha' },
        { name: 'Gamma' },
      ];
      bookkeepingServiceMock.retrieveRunTypes.resolves(mockRunTypes);
      filterService = new FilterService(bookkeepingServiceMock);

      await filterService.getRunTypes();

      deepStrictEqual(filterService.runTypes, ['Alpha', 'Beta', 'Gamma']);
    });

    test('should handle empty run types response', async () => {
      bookkeepingServiceMock.retrieveRunTypes.resolves([]);
      filterService = new FilterService(bookkeepingServiceMock);

      await filterService.getRunTypes();

      deepStrictEqual(filterService.runTypes, []);
    });

    test('should handle when bookkeeping service is not active', async () => {
      bookkeepingServiceMock.active = false;
      filterService = new FilterService(bookkeepingServiceMock);

      // When the service is not active, getRunTypes shouldn't modify the runTypes
      await filterService.getRunTypes();
      deepStrictEqual(filterService.runTypes, []);
    });
  });
};
