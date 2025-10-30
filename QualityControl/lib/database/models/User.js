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

import { INTEGER, DATE, NOW, STRING } from 'sequelize';

/**
 * User model that represents a user in the database.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {Model} The User model.
 */
export default (sequelize) => {
  const UserModel = sequelize.define('User', {
    id: {
      type: INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false,
    },
    username: {
      type: STRING(250),
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    name: {
      type: STRING(250),
      allowNull: true,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  UserModel.associate = (models) => {
    UserModel.hasMany(models.Layout, {
      foreignKey: 'owner_username',
      onDelete: 'CASCADE',
    });
  };

  return UserModel;
};
