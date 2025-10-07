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

'use strict';

export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('layouts', [
    {
      id: '671b8c22402408122e2f20dd',
      name: 'test',
      description: '',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'anonymous',
    },
    {
      id: '671b95883d23cd0d67bdc787',
      name: 'a-test',
      description: '',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'anonymous',
    },
    {
      id: '671b961f3d23cd0d67bdc78a',
      name: 'SYNTHETIC',
      description: '',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'anonymous',
    },
    {
      id: '671b95a8e4f3f70f2f5e4b1a',
      name: 'SYNTHETIC_proton-proton',
      description: '',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'anonymous',
    },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('layouts', null, { transaction });
  });
};
