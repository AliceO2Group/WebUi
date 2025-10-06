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

import { UserRepository } from './UserRepository.js';
import { LayoutRepository } from './LayoutRepository.js';
import { TabRepository } from './TabRepository.js';
import { GridTabCellRepository } from './GridTabCellRepository.js';
import { ChartRepository } from './ChartRepository.js';
import { ChartOptionsRepository } from './ChartOptionsRepository.js';
import { OptionRepository } from './OptionRepository.js';

/**
 * Sets up and returns all repositories with their respective models.
 * @param {Sequelize} sequelizeDatabase - The Sequelize instance containing the models.
 * @param {object} sequelizeDatabase.models - The Sequelize models.
 * @returns {object} An object containing all the repositories.
 */
export const setupRepositories = (sequelizeDatabase) => {
  const { Layout, User, Tab, GridTabCell, Chart, ChartOption, Option } = sequelizeDatabase.models;
  const userRepository = new UserRepository(User);
  const layoutRepository = new LayoutRepository(Layout);
  const tabRepository = new TabRepository(Tab, Layout);
  const gridTabCellRepository = new GridTabCellRepository(GridTabCell);
  const chartRepository = new ChartRepository(Chart);
  const chartOptionRepository = new ChartOptionsRepository(ChartOption);
  const optionRepository = new OptionRepository(Option);

  return {
    userRepository,
    layoutRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionRepository,
    optionRepository,
  };
};
