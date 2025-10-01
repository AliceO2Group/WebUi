/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { InvalidInputError, LogManager, NotFoundError } from '@aliceo2/web-ui';
import { UserService } from './UserService.js';
import { normalizeLayout } from './helpers/normalizeLayout.js';
import { ChartOptionsSynchronizer } from './helpers/chartOptionsSynchronizer.js';
import { GridTabCellSynchronizer } from './helpers/gridTabCellSynchronizer.js';
import { TabSynchronizer } from './helpers/tabSynchronizer.js';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/layout-svc`;

/**
 * @typedef {import('../../database/repositories/LayoutRepository').LayoutRepository.js} LayoutRepository
 * @typedef {import('../../database/repositories/UserRepository').UserRepository.js} UserRepository
 * @typedef {import('../../database/repositories/TabRepository').TabRepository.js} TabRepository
 * @typedef {import('../../database/repositories/GridTabCellRepository').GridTabCellRepository.js} GridTabCellRepository
 * @typedef {import('../../database/repositories/ChartRepository').ChartRepository.js} ChartRepository
 * @typedef {
 *   import('../../database/repositories/ChartOptionsRepository').ChartOptionsRepository.js
 * } ChartOptionsRepository
 * @typedef {import('../../database/repositories/OptionRepository').OptionRepository.js} OptionRepository
 */

/**
 * Class that handles the business logic for the layouts
 */
export class LayoutService {
  /**
   * Creates an instance of the LayoutService class
   * @param {LayoutRepository} layoutRepository Repository that handles the datbase operations for the layouts
   * @param {UserRepository} userRepository Repository that handles the datbase operations for the users
   * @param {TabRepository} tabRepository Repository that handles the datbase operations for the tabs
   * @param {GridTabCellRepository} gridTabCellRepository
   * Repository that handles the datbase operations for the grid tab cells
   * @param {ChartRepository} chartRepository Repository that handles the datbase operations for the charts
   * @param {ChartOptionsRepository} chartOptionsRepository
   * Repository that handles the datbase operations for the chart options
   * @param {OptionRepository} optionRepository Repository that handles the datbase operations for the options
   */
  constructor(
    layoutRepository,
    userRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionsRepository,
    optionRepository,
  ) {
    this._logger = LogManager.getLogger(LOG_FACILITY);

    // repositories
    this._layoutRepository = layoutRepository;
    this._tabRepository = tabRepository;
    this._gridTabCellRepository = gridTabCellRepository;
    this._chartRepository = chartRepository;
    this._chartOptionRepository = chartOptionsRepository;
    this._optionRepository = optionRepository;

    // services
    this._userService = new UserService(userRepository);

    // helpers
    this._chartOptionsSynchronizer = new ChartOptionsSynchronizer(this._chartOptionRepository, this._optionRepository);
    this._gridTabCellSynchronizer = new GridTabCellSynchronizer(
      this._gridTabCellRepository,
      this._chartRepository,
      this._chartOptionsSynchronizer,
    );
    this._tabSynchronizer = new TabSynchronizer(this._tabRepository, this._gridTabCellSynchronizer);
  }

  /**
   * Retrieves a filtered list of layouts
   * @param {object} [filters={}] - Filter criteria for layouts.
   * @returns {Promise<Array<object>>} Array of layout objects matching the filters
   */
  async getLayoutsByFilters(filters = {}) {
    if (Number.isInteger(filters?.owner_id)) {
      const ownerId = parseInt(filters.owner_id, 10);
      const owner_username = await this._userService.getUsernameById(ownerId);
      filters = { ...filters, owner_username };
    }
    delete filters.owner_id;
    const layouts = await this._layoutRepository.findLayoutsByFilters(filters);
    return layouts;
  }

  /**
   * Finds a layout by its ID
   * @param {string} id - Layout ID
   * @throws {NotFoundError} If no layout is found with the given ID
   * @returns {Promise<LayoutAttributes>} The layout found
   */
  async getLayoutById(id) {
    const layoutFound = await this._layoutRepository.findLayoutById(id);
    if (!layoutFound) {
      throw new NotFoundError(`Layout with id: ${id} was not found`);
    }
    return layoutFound;
  }

  /**
   * Gets a single object by its ID
   * @param {*} id - Object ID
   * @returns {Promise<object>} The object found
   * @throws {InvalidInputError} If the ID is not provided
   * @throws {NotFoundError} If no object is found with the given ID
   * @throws {Error} If an error occurs during the operation
   */
  async getObjectById(id) {
    try {
      if (!id) {
        throw new InvalidInputError('Id must be provided');
      }
      const object = await this._gridTabCellRepository.findObjectByChartId(id);
      if (!object) {
        throw new NotFoundError(`Object with id ${id} not found`);
      }
      return object;
    } catch (error) {
      this._logger.errorMessage(`Error getting object by ID: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Updates an existing layout by ID
   * @param {string} id - Layout ID
   * @param {Partial<LayoutAttributes>} updateData - Fields to update
   * @returns {Promise<string>} Layout ID of the updated layout
   * @throws {Error} If an error occurs updating the layout
   */
  async putLayout(id, updateData) {
    const transaction = await this._layoutRepository.model.sequelize.transaction();
    try {
      const normalizedLayout = await normalizeLayout(updateData, {}, true, this._userService);
      await this._updateLayout(id, normalizedLayout, transaction);
      if (updateData.tabs) {
        await this._tabSynchronizer.sync(id, updateData.tabs, transaction);
      }
      await transaction.commit();
      return id;
    } catch (error) {
      await transaction.rollback();
      this._logger.trace(error);
      this._logger.errorMessage(`Error in putLayout: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Partially updates an existing layout by ID
   * @param {string} id - Layout ID
   * @param {Partial<LayoutAttributes>} updateData - Fields to update
   * @returns {Promise<void>}
   * @throws {Error} If an error occurs updating the layout
   */
  async patchLayout(id, updateData) {
    const normalizedLayout = await normalizeLayout(updateData, {}, false, this._userService);
    await this._updateLayout(id, normalizedLayout);
  }

  /**
   * Updates a layout in the database
   * @param {string} layoutId - ID of the layout to update
   * @param {Partial<LayoutAttributes>} updateData - Data to update
   * @param {object} [transaction] - Optional transaction object
   * @throws {NotFoundError} If no layout is found with the given ID
   * @returns {Promise<void>}
   */
  async _updateLayout(layoutId, updateData, transaction) {
    const updatedCount = await this._layoutRepository.updateLayout(layoutId, updateData, { transaction });
    if (updatedCount === 0) {
      throw new NotFoundError(`Layout with id ${layoutId} not found`);
    }
  }

  /**
   * Removes a layout by ID
   * @param {string} id - Layout ID
   * @throws {NotFoundError} If no layout is found with the given ID
   * @returns {Promise<void>}
   */
  async removeLayout(id) {
    const deletedCount = await this._layoutRepository.deleteLayout(id);
    if (deletedCount === 0) {
      throw new NotFoundError(`Layout with id ${id} not found`);
    }
  }

  /**
   * Creates a new layout
   * @param {Partial<LayoutAttributes>} layoutData - Data for the new layout
   * @throws {InvalidInputError} If a layout with the same unique fields (e.g., name) already exists
   * @returns {Promise<LayoutAttributes>} The created layout
   */
  async postLayout(layoutData) {
    const transaction = await this._layoutRepository.model.sequelize.transaction();
    try {
      const normalizedLayout = await normalizeLayout(layoutData, {}, true, this._userService);
      const newLayout = await this._layoutRepository.createLayout(normalizedLayout, { transaction });
      if (layoutData.tabs && layoutData.tabs.length) {
        await this._tabSynchronizer.sync(newLayout.id, layoutData.tabs, transaction);
      }
      await transaction.commit();
      return newLayout;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
