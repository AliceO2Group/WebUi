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
 * Seed chart options
 * @param {QueryInterface} queryInterface - The query interface
 */
export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('chart_options', [
    {
      chart_id: 1,
      option_id: 1,
    },
    {
      chart_id: 1,
      option_id: 2,
    },
    {
      chart_id: 2,
      option_id: 1,
    },
    {
      chart_id: 3,
      option_id: 3,
    },
    {
      chart_id: 4,
      option_id: 4,
    },
    {
      chart_id: 5,
      option_id: 5,
    },
    {
      chart_id: 5,
      option_id: 6,
    },
    {
      chart_id: 6,
      option_id: 7,
    },
  ], {});
};

/**
 * Remove seeded chart options
 * @param {QueryInterface} queryInterface - The query interface
 */
export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('chart_options', null, { transaction });
  });
};
