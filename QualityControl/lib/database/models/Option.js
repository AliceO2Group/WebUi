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

import { INTEGER, STRING, DATE, NOW } from 'sequelize';

export default (sequelize) => {
  const Option = sequelize.define('Option', {
    id: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: STRING(255),
      allowNull: false,
    },
    type: {
      type: STRING(255),
      allowNull: false,
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
    tableName: 'options',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Option.associate = (models) => {
    Option.hasMany(models.ChartOption, { foreignKey: 'option_id' });
  };

  return Option;
};
