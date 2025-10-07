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
      chart_id: 1,
      row: 0,
      col: 0,
      tab_id: 1,
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: 2,
      row: 0,
      col: 1,
      tab_id: 1,
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: 3,
      row: 0,
      col: 2,
      tab_id: 1,
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: 4,
      row: 1,
      col: 0,
      tab_id: 1,
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: 5,
      row: 0,
      col: 0,
      tab_id: 2,
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: 6,
      row: 0,
      col: 0,
      tab_id: 3,
      row_span: 1,
      col_span: 1,
    },
    {
      chart_id: 6,
      row: 1,
      col: 0,
      tab_id: 3,
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
