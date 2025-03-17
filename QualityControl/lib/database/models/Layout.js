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

class Layout extends Model {}

Layout.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  display_timestamp: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  auto_tab_change_interval: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  owner_username: {
    type: DataTypes.STRING(250),
    allowNull: false,
    references: {
      model: 'User',
      key: 'username',
    },
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
  modelName: 'Layout',
  tableName: 'layouts',
  timestamps: true,
});

export default Layout;
