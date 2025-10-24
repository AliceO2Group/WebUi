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

import { ok } from 'node:assert';
import { suite, test } from 'node:test';
import { API_ADAPTED_LAYOUT_MOCK, RAW_LAYOUT_MOCK } from '../../../demoData/layout/layout.mock.js';
import { mapLayoutToAPI } from '../../../../lib/controllers/helpers/mapLayoutToAPI.js';

export const mapLayoutToAPITestSuite = async () => {
  suite('mapLayoutToAPI', () => {
    test('should map backend layout to API format correctly', () => {
      const backendLayout = RAW_LAYOUT_MOCK;
      const adaptedLayout = API_ADAPTED_LAYOUT_MOCK;

      const result = mapLayoutToAPI(backendLayout);
      ok(JSON.stringify(result) === JSON.stringify(adaptedLayout));
    });
    test('should filter fields when fields parameter is provided', () => {
      const backendLayout = RAW_LAYOUT_MOCK;
      const fields = ['id', 'name', 'owner_id'];

      const result = mapLayoutToAPI(backendLayout, fields);
      const expected = {
        id: backendLayout.id,
        name: backendLayout.name,
        owner_id: backendLayout.owner.id,
      };

      ok(JSON.stringify(result) === JSON.stringify(expected));
    });
  });
};
