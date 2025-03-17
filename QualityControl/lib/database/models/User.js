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

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../index.js';

/** Class representing a user. */
class User extends Model {}

/**
 * Initializes the User model.
 * @property {string} username - The unique username of the user.
 * @property {string} [name] - The full name of the user (optional).
 * @property {Date} createdAt - The timestamp when the user was created.
 * @property {Date} updatedAt - The timestamp when the user was last updated.
 */
User.init({
  username: {
    type: DataTypes.STRING(250),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
});

export default User;
