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

// /usr/src/app/lib/database/migrations/20250313151315-create-chart_options-table.mjs
'use strict';

/** @type {import('sequelize-cli').Migration} */

/**
 * Migration script to create the 'chart_options' table.
 * @param {object} queryInterface - The interface for database operations.
 * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('chart_options', {
    chart_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'charts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    option_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'options',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
  }, {
    uniqueKeys: {
      unique_grid_tab_cells: {
        fields: ['chart_id', 'option_id'],
      },
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
  await queryInterface.dropTable('chart_options');
};
