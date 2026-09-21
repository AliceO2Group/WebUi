/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import ChartModel from './Chart.js';
import ChartOptionModel from './ChartOption.js';
import GridTabCellModel from './GridTabCell.js';
import LayoutModel from './Layout.js';
import OptionModel from './Option.js';
import TabModel from './Tab.js';
import UserModel from './User.js';

export default (sequelize) => {
  const models = {
    Chart: ChartModel(sequelize),
    ChartOption: ChartOptionModel(sequelize),
    GridTabCell: GridTabCellModel(sequelize),
    Layout: LayoutModel(sequelize),
    Option: OptionModel(sequelize),
    Tab: TabModel(sequelize),
    User: UserModel(sequelize),
  };

  Object.entries(models).forEach(([, model]) => {
    if (typeof model.associate === 'function') {
      model.associate(sequelize.models);
    }
  });
  return models;
};
