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

export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('tabs', [
    {
      id: '671b8c227b3227b0c603c29d',
      name: 'main',
      layout_id: '671b8c22402408122e2f20dd',
      column_count: 2,
    },
    {
      id: '671b8c5aa66868891b977311',
      name: 'test-tab',
      layout_id: '671b8c22402408122e2f20dd',
      column_count: 3,
    },
    {
      id: '671b95884312f03458f1d9ca',
      name: 'main',
      layout_id: '671b95883d23cd0d67bdc787',
      column_count: 2,
    },
    {
      id: '671b958b8a5cfb52ee9ef2a1',
      name: 'a',
      layout_id: '671b95883d23cd0d67bdc787',
      column_count: 2,
    },
    {
      id: '671b961f9f1e4e0f4c5b8c3d',
      name: 'main',
      layout_id: '671b961f3d23cd0d67bdc78a',
      column_count: 2,
    },
    {
      id: '671b95a8f0e4f70f2f5e4b1b',
      name: 'main',
      layout_id: '671b95a8e4f3f70f2f5e4b1a',
      column_count: 2,
    },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('tabs', null, { transaction });
  });
};
