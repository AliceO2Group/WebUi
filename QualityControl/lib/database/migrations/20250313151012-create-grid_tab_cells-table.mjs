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

// /usr/src/app/lib/database/migrations/20250313151012-create-grid_tab_cells-table.mjs
'use strict';

/** @type {import('sequelize-cli').Migration} */

/**
 * Migration script to create the 'grid_tab_cells' table.
 * @param {object} queryInterface - The interface for database operations.
 * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('grid_tab_cells', {
    chart_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'charts',
        key: 'id',
      },
    },
    row: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    col: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    tab_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tabs',
        key: 'id',
      },
    },
    row_span: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    col_span: {
      type: Sequelize.INTEGER,
      allowNull: true,
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
        fields: ['chart_id', 'row', 'col', 'tab_id'],
      },
    },
  });
};

/**
 * Migration script to drop the 'grid_tab_cells' table.
 * @param {object} queryInterface - The interface for database operations.
 * @param {Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const down = async (queryInterface) => {
  await queryInterface.dropTable('grid_tab_cells');
};
