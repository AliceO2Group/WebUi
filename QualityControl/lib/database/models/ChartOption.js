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

/**
 * ChartOption model that represents the association between charts and options.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {Model} The ChartOption model.
 */
export default (sequelize) => {
  const ChartOption = sequelize.define('ChartOption', {
    id: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    chart_id: {
      type: STRING(250),
      allowNull: false,
      references: {
        model: 'Chart',
        key: 'id',
      },
    },
    option_id: {
      type: INTEGER,
      allowNull: false,
      references: {
        model: 'Option',
        key: 'id',
      },
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
    tableName: 'chart_options',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    uniqueKeys: {
      unique_chart_options: {
        fields: ['chart_id', 'option_id'],
      },
    },
  });

  ChartOption.associate = (models) => {
    ChartOption.belongsTo(models.Chart, { foreignKey: 'chart_id', as: 'chart' });
    ChartOption.belongsTo(models.Option, { foreignKey: 'option_id', as: 'option' });
  };

  return ChartOption;
};
