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

import { LayoutAdapter } from '../../../../lib/controllers/adapters/layout-adapter.js';
import test, { suite } from 'node:test';
import { deepStrictEqual, throws } from 'node:assert';
import { LAYOUT_ADAPTED_MOCK, LAYOUT_INPUT_MOCK } from '../../../demoData/layout/layout.mock.js';

export const layoutAdapterTestSuite = async () => {
  suite('LayoutAdapter.adaptLayoutForExpressAPI', () => {
    test('should correctly adapt a valid layout object', () => {
      const result = LayoutAdapter.adaptLayoutForExpressAPI(LAYOUT_INPUT_MOCK);
      deepStrictEqual(result, LAYOUT_ADAPTED_MOCK);
    });

    test('should throw an when input is malformed', () => {
      const badInput = null;

      throws(
        () => LayoutAdapter.adaptLayoutForExpressAPI(badInput),
        new Error ("Error adapting layout: Cannot read properties of null (reading 'id')"),
      );
    });
  });
};
