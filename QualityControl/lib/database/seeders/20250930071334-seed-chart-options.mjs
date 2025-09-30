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

/**
 * Seed chart options
 * @param {*} queryInterface - The query interface
 */
export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('chart_options', [
    {
      chart_id: '671b8c25d5b49dbf80e81926',
      option_id: 1,
    },
    {
      chart_id: '671b8c25d5b49dbf80e81926',
      option_id: 2,
    },
    {
      chart_id: '671b8c256cdd70443c1cd709',
      option_id: 1,
    },
    {
      chart_id: '671b8c266dd77d73874f4e90',
      option_id: 3,
    },
    {
      chart_id: '671b8c2bcc75ce6053c67874',
      option_id: 4,
    },
    {
      chart_id: '671b8c604deeb0f548863a8c',
      option_id: 5,
    },
    {
      chart_id: '671b8c604deeb0f548863a8c',
      option_id: 6,
    },
    {
      chart_id: '6724a6bd1b2bad3d713cc4ee',
      option_id: 7,
    },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('chart_options', null, { transaction });
  });
};
