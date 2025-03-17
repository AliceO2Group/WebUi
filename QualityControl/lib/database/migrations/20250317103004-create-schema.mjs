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

// /usr/src/app/lib/database/migrations/20250313123608-create-users-table.mjs
'use strict';

/** @type {import('sequelize-cli').Migration} */

/**
 * Migration script to create the database tables.
 * @param {object} queryInterface - The interface for database operations.
 * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('users', {
    username: {
      type: Sequelize.STRING(250),
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: Sequelize.STRING(250),
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
  });
  await queryInterface.createTable('layouts', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(40),
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    display_timestamp: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    auto_tab_change_interval: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    owner_username: {
      type: Sequelize.STRING(250),
      allowNull: false,
      references: {
        model: 'users',
        key: 'username',
      },
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
  await queryInterface.createTable('tabs', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    layout_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'layouts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    column_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2,
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
  await queryInterface.createTable('charts', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    object_name: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    ignore_defaults: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
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
 * Migration script to drop the database tables.
 * @param {object} queryInterface - The interface for database operations.
 * @param {Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the table is created.
 */
export const down = async (queryInterface) => {
  const tables = ['users', 'layouts', 'tabs', 'charts', 'grid_tab_cells', 'options', 'chart_options'];
  tables.forEach(async (table) => {
    await queryInterface.dropTable(table);
  });
};
