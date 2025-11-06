/**
 * @param sequelize
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

import { DATE, NOW, STRING, BOOLEAN, INTEGER } from 'sequelize';

/**
 * Chart model that represents a chart in the database.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {Model} The Chart model.
 */
export default (sequelize) => {
  const Chart = sequelize.define(
    'Chart',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      object_name: {
        type: STRING(255),
        allowNull: true,
      },
      ignore_defaults: {
        type: BOOLEAN,
        allowNull: true,
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
    },
    {
      tableName: 'charts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  Chart.associate = (models) => {
    Chart.hasOne(models.GridTabCell, {
      foreignKey: 'chart_id',
      onDelete: 'CASCADE',
    });
    Chart.hasMany(models.ChartOption, {
      foreignKey: 'chart_id',
      as: 'chartOptions',
      onDelete: 'CASCADE',
    });
  };

  return Chart;
};
