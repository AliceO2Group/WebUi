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

// /usr/src/app/lib/database/migrations/20250313151205-create-options-table.mjs
'use strict';

/** @type {import('sequelize-cli').Migration} */

/**
 * Migration script to create the 'options' table.
 * @param {object} queryInterface - The interface for database operations.
 * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('options', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  });
};

/**
 * Migration script to drop the 'users' table.
 * @param {object} queryInterface - The interface for database operations.
 * @param {Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const down = async (queryInterface) => {
  await queryInterface.dropTable('options');
};
