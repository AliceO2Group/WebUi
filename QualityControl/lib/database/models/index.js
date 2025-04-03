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

import ChartModel from './Chart.js';
import ChartOptionModel from './ChartOption.js';
import GridTabCellModel from './GridTabCell.js';
import LayoutModel from './Layout.js';
import OptionModel from './Option.js';
import TabModel from './Tab.js';
import UserModel from './User.js';

/**
 * Initializes and sets up the database models with the provided Sequelize instance.
 *
 * This function initializes all models, associates them if necessary,
 * and returns an object containing all the models.
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance to initialize models with.
 * @returns {object} An object containing all initialized Sequelize models.
 * @throws {Error} Throws an error if model initialization fails.
 */
export function initializeModels(sequelize) {
  try {
    const models = {
      User: UserModel(sequelize),
      Chart: ChartModel(sequelize),
      ChartOption: ChartOptionModel(sequelize),
      GridTabCell: GridTabCellModel(sequelize),
      Layout: LayoutModel(sequelize),
      Option: OptionModel(sequelize),
      Tab: TabModel(sequelize),
    };

    Object.keys(models).forEach((modelName) => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    return models;
  } catch (error) {
    throw new Error('Failed to initialize database models', error);
  }
}
