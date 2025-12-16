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

/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * Seed layouts
 * @param {QueryInterface} queryInterface - The query interface
 */
export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('layouts', [
    {
      id: 1,
      old_id: '671b8c22402408122e2f20dd',
      name: 'PHYSICS_PB-PB',
      description: 'A layout used for Pb-Pb physics runs',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'anonymous',
    },
    {
      id: 2,
      old_id: '671b95883d23cd0d67bdc787',
      name: 'EMC Detector Overview',
      description: 'A layout for the EMC detector expert',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'detector-expert',
    },
    {
      id: 3,
      old_id: '3d23671b9588787cd0d67bdc',
      name: 'Some Other Layout',
      description: 'A layout owned by some other user',
      display_timestamp: false,
      auto_tab_change_interval: 0,
      owner_username: 'run-coordinator',
    },
  ], {});
};

/**
 * Remove seeded layouts
 * @param {QueryInterface} queryInterface - The query interface
 */
export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('layouts', null, { transaction });
  });
};
