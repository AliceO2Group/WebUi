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
  await queryInterface.bulkInsert('options', [
    {
      name: 'lego',
      type: 'drawing',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'colz',
      type: 'drawing',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'lcolz',
      type: 'drawing',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'text',
      type: 'drawing',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'logx',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'logy',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'logz',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'gridx',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'gridy',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'gridz',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'stat',
      type: 'hint',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('options', null, { transaction });
  });
};
