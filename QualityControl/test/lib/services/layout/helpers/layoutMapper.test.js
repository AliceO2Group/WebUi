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

import { deepStrictEqual } from 'node:assert';
import { normalizeLayout } from '../../../../../lib/services/layout/helpers/layoutMapper.js';
import { test } from 'node:test';

export const layoutMapperTestSuite = async () => {
  const mockUserService = {
    getUsernameById: async (id) => {
      const users = {
        1: 'alice',
        2: 'bob',
      };
      return users[id] || null;
    },
  };

  const mockPatch = {
    isOfficial: true,
  };

  const mockFullUpdate = {
    name: 'Updated Layout',
    description: 'This is the updated layout',
    displayTimestamp: false,
    autoTabChange: 60,
    isOfficial: false,
    owner_id: 2,
  };

  const mockOriginalLayout = {
    id: 10,
    name: 'Original Layout',
    description: 'This is the original layout',
    displayTimestamp: true,
    autoTabChange: 30,
    isOfficial: false,
    owner_id: 1,
  };

  test('should patch a layout correctly', async () => {
    const result = await normalizeLayout(mockPatch, mockOriginalLayout, false, mockUserService);
    deepStrictEqual(result, {
      is_official: true,
    });
  });

  test ('should fully replace a layout correctly', async () => {
    const result = await normalizeLayout(mockFullUpdate, mockOriginalLayout, true, mockUserService);
    deepStrictEqual(result, {
      id: 10,
      name: 'Updated Layout',
      description: 'This is the updated layout',
      display_timestamp: false,
      auto_tab_change_interval: 60,
      is_official: false,
      owner_username: 'bob',
    });
  });
};
