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

import { STRING, INTEGER, DATE, NOW } from 'sequelize';

/**
 * Tab model that represents a tab in the database.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {Model} The Tab model.
 */
export default (sequelize) => {
  const TabModel = sequelize.define('Tab', {
    id: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: STRING(50),
      allowNull: false,
    },
    layout_id: {
      type: INTEGER,
      allowNull: false,
      references: {
        model: 'Layout',
        key: 'id',
      },
    },
    column_count: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 2,
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
    tableName: 'tabs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['layout_id', 'name'],
      },
    ],
  });

  TabModel.associate = (models) => {
    TabModel.belongsTo(models.Layout, {
      foreignKey: 'layout_id', as: 'layout',
    });

    TabModel.hasMany(models.GridTabCell, {
      foreignKey: 'tab_id',
      as: 'gridTabCells',
      onDelete: 'CASCADE', // Add onDelete: 'CASCADE'
    });
  };

  return TabModel;
};
