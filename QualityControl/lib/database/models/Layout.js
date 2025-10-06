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

import { STRING, BOOLEAN, INTEGER, DATE, NOW } from 'sequelize';

/**
 * Layout model that represents a layout in the database.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {Model} The Layout model.
 */
export default (sequelize) => {
  const LayoutModel = sequelize.define('Layout', {
    id: {
      type: STRING(250),
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: STRING(40),
      allowNull: false,
      unique: true,
    },
    description: {
      type: STRING(100),
      allowNull: true,
    },
    display_timestamp: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    auto_tab_change_interval: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    owner_username: {
      type: STRING(250),
      allowNull: false,
      references: {
        model: 'User',
        key: 'username',
      },
    },
    is_official: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DATE,
      allowNull: false,
      defaultValue: NOW,
    },
    updated_at: {
      type: DATE,
      allowNull: false,
      defaultValue: NOW,
    },
  }, {
    tableName: 'layouts',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  LayoutModel.associate = (models) => {
    LayoutModel.belongsTo(models.User, {
      foreignKey: 'owner_username',
      targetKey: 'username',
      as: 'owner',
    });

    LayoutModel.hasMany(models.Tab, {
      foreignKey: 'layout_id',
      as: 'tabs',
      onDelete: 'CASCADE',
    });
  };

  return LayoutModel;
};
