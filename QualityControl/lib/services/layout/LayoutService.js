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

import { LogManager, NotFoundError } from '@aliceo2/web-ui';
import { normalizeLayout } from './helpers/layoutMapper.js';
import { TabSynchronizer } from '../../services/layout/helpers/tabSynchronizer.js';
import { GridTabCellSynchronizer } from './helpers/gridTabCellSynchronizer.js';
import { ChartOptionsSynchronizer } from './helpers/chartOptionsSynchronizer.js';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/layout-svc`;

/**
 * @typedef {import('../../database/repositories/LayoutRepository').LayoutRepository} LayoutRepository
 * @typedef {import('../../database/repositories/GridTabCellRepository').GridTabCellRepository} GridTabCellRepository
 * @typedef {import('../../services/layout/UserService.js').UserService} UserService
 * @typedef {import('../../services/layout/helpers/tabSynchronizer.js').TabSynchronizer} TabSynchronizer
 */

/**
 * Class that handles the business logic for the layouts
 */
export class LayoutService {
  /**
   * Creates an instance of the LayoutService class
   * @param {LayoutRepository} layoutRepository Layout repository instance
   * @param tabRepository
   * @param {GridTabCellRepository} gridTabCellRepository Grid tab cell repository instance
   * @param {UserService} userService User service instance
   * @param {TabSynchronizer} tabSynchronizer Tab synchronizer instance
   * @param chartRepository
   * @param chartOptionRepository
   * @param optionRepository
   */
  constructor(
    layoutRepository,
    userService,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionRepository,
    optionRepository,
  ) {
    this._logger = LogManager.getLogger(LOG_FACILITY);
    this._layoutRepository = layoutRepository;
    this._gridTabCellRepository = gridTabCellRepository;
    this._userService = userService;

    // Synchronizers
    this._chartOptionsSynchronizer = new ChartOptionsSynchronizer(
      chartOptionRepository,
      optionRepository,
    );
    this._gridTabCellSynchronizer = new GridTabCellSynchronizer(
      gridTabCellRepository,
      chartRepository,
      this._chartOptionsSynchronizer,
    );
    this._tabSynchronizer = new TabSynchronizer(
      tabRepository,
      this._gridTabCellSynchronizer,
    );
  }

  /**
   * Retrieves a filtered list of layouts
   * @param {object} [filters={}] - Filter criteria for layouts.
   * @returns {Promise<Array<object>>} Array of layout objects matching the filters
   */
  async getLayoutsByFilters(filters = {}) {
    try {
      if (filters.owner_id !== undefined) {
        filters = await this._addOwnerUsername(filters);
      }
      const layouts = await this._layoutRepository.findLayoutsByFilters(filters);
      return layouts;
    } catch (error) {
      this._logger.errorMessage(`Error getting layouts by filters: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Adds the owner's username to the filters based on owner_id
   * @param {object} filters - The original filters object
   * @returns {Promise<object>} The updated filters object with owner_username
   */
  async _addOwnerUsername(filters) {
    try {
      const owner_username = await this._userService.getUsernameById(filters.owner_id);
      filters = { ...filters, owner_username };
      delete filters.owner_id;
      return filters;
    } catch (error) {
      this._logger.errorMessage(`Error adding owner username to filters: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Finds a layout by its ID
   * @param {string} id - Layout ID
   * @throws {NotFoundError} If no layout is found with the given ID
   * @returns {Promise<LayoutAttributes>} The layout found
   */
  async getLayoutById(id) {
    try {
      if (!id) {
        throw new Error('Layout ID must be provided');
      }
      const layoutFoundById = await this._layoutRepository.findById(id);
      let layoutFoundByOldId = null;
      if (!layoutFoundById) {
        layoutFoundByOldId = await this._layoutRepository.findOne({ old_id: id });
      }

      if (!layoutFoundById && !layoutFoundByOldId) {
        throw new NotFoundError(`Layout with id: ${id} was not found`);
      }
      return layoutFoundById || layoutFoundByOldId;
    } catch (error) {
      this._logger.errorMessage(`Error getting layout by ID: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Finds a layout by its name
   * @param {string} name - Layout name
   * @throws {NotFoundError} If no layout is found with the given name
   * @returns {Promise<LayoutAttributes>} The layout found
   */
  async getLayoutByName(name) {
    try {
      const layout = await this._layoutRepository.findOne({ name });
      if (!layout) {
        throw new NotFoundError(`Layout with name: ${name} was not found`);
      }
      return layout;
    } catch (error) {
      this._logger.errorMessage(`Error getting layout by name: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Gets a single object by its ID
   * @param {*} objectId - Object ID
   * @returns {Promise<object>} The object found
   * @throws {InvalidInputError} If the ID is not provided
   * @throws {NotFoundError} If no object is found with the given ID
   * @throws {Error} If an error occurs during the operation
   */
  async getObjectById(objectId) {
    try {
      const object = await this._gridTabCellRepository.findObjectByChartId(objectId);
      if (!object) {
        throw new NotFoundError(`Object with id: ${objectId} was not found`);
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
    //TODO: Owner verification in the middleware. Plus addd ownerUsername to updateData
    const transaction = await this._layoutRepository.model.sequelize.transaction();
    try {
      const layout = await this.getLayoutById(id);
      const normalizedLayout = await normalizeLayout(updateData, layout, true);
      const updatedCount = await this._layoutRepository.updateLayout(id, normalizedLayout);
      if (updatedCount === 0) {
        throw new NotFoundError(`Layout with id ${id} not found`);
      }
      if (updateData.tabs) {
        await this._tabSynchronizer.sync(id, updateData.tabs, transaction);
      }
      await transaction.commit();
      return id;
    } catch (error) {
      await transaction.rollback();
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
    const transaction = await this._layoutRepository.model.sequelize.transaction();
    try {
      const normalizedLayout = await normalizeLayout(updateData);
      const count = await this._updateLayout(id, normalizedLayout, transaction);
      if (count === 0) {
        throw new NotFoundError(`Layout with id ${id} not found`);
      }
      if (updateData.tabs) {
        await this._tabSynchronizer.sync(id, updateData.tabs, transaction);
      }
      await transaction.commit();
      return id;
    } catch (error) {
      await transaction.rollback();
      this._logger.errorMessage(`Error in patchLayout: ${error.message || error}`);
      throw error;
    }
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
    const result = await this._layoutRepository.updateLayout(layoutId, updateData, { transaction });
    const updatedCount = Array.isArray(result) ? result[0] : result;
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
    try {
      const deletedCount = await this._layoutRepository.delete(id);
      if (deletedCount === 0) {
        throw new NotFoundError(`Layout with id ${id} not found for deletion`);
      }
    } catch (error) {
      this._logger.errorMessage(`Error in removeLayout: ${error.message || error}`);
      throw error;
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
      const ownerUsername = await this._userService.getUsernameById(layoutData.owner_id);
      layoutData.ownerUsername = ownerUsername;
      const normalizedLayout = await normalizeLayout(layoutData, {}, true);
      const newLayout = await this._layoutRepository.createLayout(normalizedLayout, { transaction });
      if (!newLayout) {
        throw new Error('Failed to create new layout');
      }
      await this._tabSynchronizer.sync(newLayout.id, layoutData.tabs, transaction);
      await transaction.commit();
      return newLayout;
    } catch (error) {
      await transaction.rollback();
      this._logger.errorMessage(`Error in postLayout: ${error.message || error}`);
      throw error;
    }
  }
}
