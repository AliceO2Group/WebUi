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

/**
 * Migration script to create the database tables.
 * @param {object} queryInterface - The interface for database operations.
 * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the tables are created.
 */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false,
    },
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
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('layouts', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    old_id: {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
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
      onDelete: 'CASCADE', // Delete layouts when user is deleted
    },
    is_official: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
      onDelete: 'CASCADE', // Delete tabs when layout is deleted
    },
    column_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
      allowNull: false,
    },
    ignore_defaults: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('grid_tab_cells', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    chart_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'charts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Delete grid_tab_cells when chart is deleted
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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Delete grid_tab_cells when tab is deleted
    },
    row_span: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    col_span: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('chart_options', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
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
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  }, {
    uniqueKeys: {
      unique_chart_options: {
        fields: ['chart_id', 'option_id'],
      },
    },
  });
};

/**
 * Reverts the database schema by dropping specified tables.
 * @param {object} queryInterface - The interface for querying the database.
 * @returns {Promise<void>} A promise that resolves when the tables are dropped.
 */
export const down = async (queryInterface) => {
  const tables = ['users', 'layouts', 'tabs', 'charts', 'grid_tab_cells', 'options', 'chart_options'];
  tables.forEach(async (table) => {
    await queryInterface.dropTable(table);
  });
};
