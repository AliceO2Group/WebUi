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

class GridTabCell extends Model {}

GridTabCell.init({
  chart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Chart',
      key: 'id',
    },
  },
  row: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  col: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tab_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tab',
      key: 'id',
    },
  },
  row_span: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  col_span: {
    type: DataTypes.INTEGER,
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
  modelName: 'GridTabCell',
  tableName: 'grid_tab_cells',
  uniqueKeys: {
    unique_grid_tab_cells: {
      fields: ['chart_id', 'row', 'col', 'tab_id'],
    },
  },
  timestamps: true,
});

export default GridTabCell;
