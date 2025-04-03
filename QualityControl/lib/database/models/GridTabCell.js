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
  const GridTabCell = sequelize.define('GridTabCell', {
    id: {
      type: INTEGER,
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
    row: {
      type: INTEGER,
      allowNull: false,
    },
    col: {
      type: INTEGER,
      allowNull: false,
    },
    tab_id: {
      type: STRING(250),
      allowNull: false,
      references: {
        model: 'Tab',
        key: 'id',
      },
    },
    row_span: {
      type: INTEGER,
      allowNull: true,
    },
    col_span: {
      type: INTEGER,
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
    tableName: 'grid_tab_cells',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    uniqueKeys: {
      unique_grid_tab_cells: {
        fields: ['chart_id', 'row', 'col', 'tab_id'],
      },
    },
  });

  GridTabCell.associate = (models) => {
    GridTabCell.belongsTo(models.Tab, { foreignKey: 'tab_id', as: 'tab' });
    GridTabCell.belongsTo(models.Chart, { foreignKey: 'chart_id', as: 'chart' });
  };

  return GridTabCell;
};
