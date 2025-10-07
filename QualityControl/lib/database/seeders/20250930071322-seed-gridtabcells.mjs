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
  await queryInterface.bulkInsert('grid_tab_cells', [
    {
      chart_id: '671b8c25d5b49dbf80e81926',
      row: 0,
      col: 0,
      tab_id: '671b8c227b3227b0c603c29d',
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: '671b8c256cdd70443c1cd709',
      row: 0,
      col: 1,
      tab_id: '671b8c227b3227b0c603c29d',
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: '671b8c266dd77d73874f4e90',
      row: 0,
      col: 2,
      tab_id: '671b8c227b3227b0c603c29d',
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: '671b8c2bcc75ce6053c67874',
      row: 1,
      col: 0,
      tab_id: '671b8c227b3227b0c603c29d',
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: '671b8c604deeb0f548863a8c',
      row: 0,
      col: 0,
      tab_id: '671b8c5aa66868891b977311',
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: '6724a6bd1b2bad3d713cc4ee',
      row: 0,
      col: 0,
      tab_id: '671b95884312f03458f1d9ca',
      row_span: 1,
      col_span: 1,
    },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('grid_tab_cells', null, { transaction });
  });
};
