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
 * Seed users
 * @param {QueryInterface} queryInterface - The query interface
 */
export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('users', [
    {
      id: 0,
      name: 'Anonymous',
      username: 'anonymous' },
  ], {});
};

/**
 * Remove seeded users
 * @param {QueryInterface} queryInterface - The query interface
 */
export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('users', null, { transaction });
  });
};
