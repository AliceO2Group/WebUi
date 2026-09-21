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

'use strict';

/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * Seed tabs
 * @param {QueryInterface} queryInterface - The query interface
 */

export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('tabs', [
    {
      id: 1,
      name: 'main',
      layout_id: 1,
      column_count: 2,
    },
    {
      id: 2,
      name: 'test-tab',
      layout_id: 1,
      column_count: 3,
    },
    {
      id: 3,
      name: 'main',
      layout_id: 2,
      column_count: 2,
    },
    {
      id: 4,
      name: 'Another tab with a rather long name',
      layout_id: 2,
      column_count: 2,
    },
    {
      id: 5,
      name: 'main',
      layout_id: 3,
      column_count: 2,
    },
    {
      id: 6,
      name: 'Secondary tab',
      layout_id: 3,
      column_count: 2,
    },

  ], {});
};

/**
 * Remove seeded tabs
 * @param {QueryInterface} queryInterface - The query interface
 */
export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('tabs', null, { transaction });
  });
};
