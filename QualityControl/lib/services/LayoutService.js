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

import { LogManager } from '@aliceo2/web-ui';

/**
 * Service class for managing layouts.
 */
/**
 * Service class for managing layouts and their associated data.
 */
export class LayoutService {
/**
 * Initializes a new instance of the class with the provided repository dependencies.
 * @class
 * @param {UserRepository} userRepository - Repository for managing user data.
 * @param {LayoutRepository} layoutRepository - Repository for managing layouts.
 * @param {TabRepository} tabRepository - Repository for managing tabs.
 * @param {GridTabCellRepository} gridTabCellRepository - Repository for managing grid tab cells.
 * @param {ChartRepository} chartRepository - Repository for managing charts.
 * @param {ChartOptionsRepository} chartOptionsRepository - Repository for managing chart options.
 * @param {OptionRepository} optionsRepository - Repository for managing generic options.
 */
  constructor(
    userRepository,
    layoutRepository,
    tabRepository,
    gridTabCellRepository,
    chartRepository,
    chartOptionsRepository,
    optionsRepository,
  ) {
    this._layoutRepository = layoutRepository;
    this._userRepository = userRepository;
    this._tabsRepository = tabRepository;
    this._gridTabCellRepository = gridTabCellRepository;
    this._chartRepository = chartRepository;
    this._chartOptionsRepository = chartOptionsRepository;
    this._optionRepository = optionsRepository;

    this._logger = LogManager.getLogger('qcg/layoutService');
  }

  /**
   * Retrieves all layouts owned by a specific user.
   * @param {string} ownerId - The ID of the user whose layouts to retrieve.
   * @returns {Promise<Array>} A promise that resolves to an array of layout objects.
   * @throws {Error} If an error occurs during the retrieval process.
   */
  async getLayoutsByOwnerId(ownerId) {
    try {
      const ownerFound = await this._userRepository.findUserById(ownerId);
      if (ownerFound && ownerFound.username) {
        return this.getAllLayouts({
          owner_username: ownerFound.username,
        });
      } else {
        return [];
      }
    } catch (error) {
      this._logger.errorMessage(`Error getting layouts by owner id: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves all layouts with optional filters.
   * @param {object} filters - Optional filters to apply to the layout retrieval.
   * @returns {Promise<Array>} A promise that resolves to an array of layout objects.
   * @throws {Error} If an error occurs during the retrieval process.
   */
  async getAllLayouts(filters = {}) {
    try {
      return await this._layoutRepository.findAllLayouts(filters);
    } catch (error) {
      this._logger.errorMessage(`Error getting layouts with filters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a layout by its ID.
   * @param {string} layoutId - The ID of the layout to retrieve.
   * @throws {Error} If the layout ID is not provided or if the layout is not found.
   * @returns {Promise<object>} The layout object.
   */
  async getLayoutById(layoutId) {
    try {
      if (!layoutId) {
        throw new Error('Layout ID is required');
      }
      const foundLayout = await this._layoutRepository.findLayoutById(layoutId);
      if (!foundLayout) {
        throw new Error(`Layout with ID ${layoutId} not found`);
      }
      return foundLayout;
    } catch (error) {
      this._logger.errorMessage(`Error getting layout by id: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a layout by its name.
   * @param {string} layoutName - The name of the layout to retrieve.
   * @throws {Error} If the layout name is not provided or if the layout is not found.
   * @returns {Promise<object>} The layout object.
   */
  async getLayoutByName(layoutName) {
    try {
      if (!layoutName) {
        throw new Error('Layout name is required');
      }
      const foundLayout = await this._layoutRepository.findLayoutByName(layoutName);
      if (!foundLayout) {
        throw new Error('Layout not found');
      }
      return foundLayout;
    } catch (error) {
      this._logger.errorMessage(`Error getting layout by name: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates the layout with the provided data.
   * @param {string} layoutId - The ID of the layout
   * @param {object} patchedLayout - The layout data to update.
   * @throws {Error} If the layout is not found or if an error occurs during the update.
   * @returns {Promise<void>}
   */
  async updateLayout(layoutId, patchedLayout) {
    try {
      if (!patchedLayout || !patchedLayout.id) {
        throw new Error('Layout ID is required');
      }
      const { name, description, displayTimestamp, autoTabChange, isOfficial, tabs, owner_id }
        = patchedLayout;
      const foundLayout = await this._layoutRepository.findLayoutById(layoutId);
      if (!foundLayout) {
        throw new Error(`Layout with ID: ${layoutId} not found`);
      }
      const layoutOwner = await this._userRepository.findUserById(owner_id);
      const rowsAffected = await this._layoutRepository.updateLayout(layoutId, {
        id: layoutId,
        name,
        description,
        display_timestamp: displayTimestamp,
        auto_tab_change_interval: autoTabChange,
        owner_username: layoutOwner.username,
        is_official: isOfficial,
      });
      if (!rowsAffected || rowsAffected !== 1) {
        throw new Error('Layout not found (or not changes made)');
      }
      await this._updateTabs(layoutId, tabs);
    } catch (error) {
      this._logger.errorMessage(`Error updating layout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves an object by its ID.
   * @param {string} objectId - The ID of the object to retrieve.
   * @returns {Promise<object>} The object found.
   * @throws {Error} If the object is not found or retrieval process failed.
   */
  async getObjectById(objectId) {
    try {
      const foundObject = await this._gridTabCellRepository.findObjectByChartId(objectId);
      if (!foundObject) {
        throw new Error('Object not found');
      }
      const { tab, chart } = foundObject;
      const { name: tabName, layout } = tab;
      const { name: layoutName } = layout;
      const { object_name, ignore_defaults, chartOptions } = chart;
      return {
        layoutName: layoutName,
        tabName: tabName,
        object: {
          name: object_name,
          options: chartOptions,
          ignoreDefaults: ignore_defaults,
        },
      };
    } catch (error) {
      this._logger.errorMessage(`Error getting object by id: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates the tabs for a given layout.
   * @param {string} layoutId - The ID of the layout to update tabs for.
   * @param {Array<object>} tabs - The list of tabs to update.
   * @throws {Error} If an error occurs during the update process.
   * @returns {Promise<void>}
   */
  async _updateTabs(layoutId, tabs) {
    try {
      const updatedTabIds = new Set(tabs.map((tab) => tab.id)); // Using Set for faster lookup

      // Fetch existing tabs for comparison
      const existingTabs = await this._tabsRepository.findTabsByLayoutId(layoutId);
      const existingTabIds = new Set(existingTabs.map((tab) => tab.id));

      const tabsToUpdateOrCreate = tabs.map(async (tab) => {
        const { id: tabId, name, columns, objects } = tab;
        const tabExists = existingTabIds.has(tabId);

        if (tabExists) {
          await this._tabsRepository.updateTab({ name, layout_id: layoutId, column_count: columns }, tabId);
        } else {
          await this._tabsRepository.createTab({ id: tabId, name, layout_id: layoutId, column_count: columns });
        }

        await this._updateCells(tabId, objects);
      });

      const tabsToDelete = existingTabs.filter((tab) => !updatedTabIds.has(tab.id));

      await Promise.all([
        ...tabsToUpdateOrCreate,
        ...tabsToDelete.map((tab) => this._tabsRepository.deleteTab(tab.id)),
      ]);
    } catch (error) {
      this._logger.errorMessage(`Error updating tabs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates the cells for a given tab.
   * @param {string} tabId - The ID of the tab to update cells for.
   * @param {Array<object>} objects - The list of objects to update.
   * @returns {Promise<void>}
   * @throws {Error} If an error occurs during the update process.
   */
  async _updateCells(tabId, objects) {
    try {
      const updatedChartIds = new Set(objects.map((obj) => obj.id)); // Set for faster lookup

      // Fetch existing cells to minimize redundant DB operations
      const existingCells = await this._gridTabCellRepository.findByTabId(tabId);
      const existingChartIds = new Set(existingCells.map((cell) => cell.chart_id));

      // Process updates and creations
      const cellOperations = objects.map(async (object) => {
        const { id: chartId, x, y, h, w, name, options, ignoreDefaults } = object;
        const cellExists = existingChartIds.has(chartId);

        if (cellExists) {
          await this._chartRepository.updateChart({
            id: chartId, object_name: name, ignore_defaults: ignoreDefaults,
          }, chartId);
          await this._gridTabCellRepository.updateGridTabCell({
            chart_id: chartId, row: x, col: y, row_span: w, col_span: h, tab_id: tabId,
          }, { chart_id: chartId, tab_id: tabId });
        } else {
          await this._chartRepository.createChart({
            id: chartId, object_name: name, ignore_defaults: ignoreDefaults,
          });
          await this._gridTabCellRepository.createGridTabCell({
            chart_id: chartId, row: x, col: y, row_span: w, col_span: h, tab_id: tabId,
          });
        }
        await this._updateOptions(chartId, options);
      });

      // Identify and delete cells that are no longer in the updated list
      const cellsToDelete = existingCells.filter((cell) => !updatedChartIds.has(cell.chart_id));

      await Promise.all([
        ...cellOperations,
        ...cellsToDelete.map((cell) => this._gridTabCellRepository.deleteGridTabCell(cell.id)),
      ]);
    } catch (error) {
      this._logger.errorMessage(`Error updating cells: ${error.message}`);
    }
  }

  /**
   * Updates the options for a given chart.
   * @param {string} chartId - The ID of the chart to update options for.
   * @param {Array<string>} options - The list of option names to set for the chart.
   * @returns {Promise<void>}
   * @throws {Error} If an error occurs during the update process.
   */
  async _updateOptions(chartId, options) {
    try {
      const optionResults = await Promise.all(options.map((option) => this._optionRepository.findOptionByName(option)));
      const validOptions = optionResults.filter(Boolean).map((opt) => opt.id);

      const existingChartOptions = await this._chartOptionsRepository.findChartOptionsByChartId(chartId);
      const existingOptionIds = new Set(existingChartOptions.map((opt) => opt.option_id));

      await Promise.all(validOptions.map(async (optionId) => {
        if (existingOptionIds.has(optionId)) {
          await this._chartOptionsRepository
            .updateChartOption({ chartId, optionId });
        } else {
          await this._chartOptionsRepository.createChartOption({ chart_id: chartId, option_id: optionId });
        }
      }));

      const optionsToDelete = existingChartOptions.filter((opt) => !validOptions.includes(opt.option_id));

      await Promise.all(optionsToDelete.map((opt) =>
        this._chartOptionsRepository.deleteChartOption(chartId, opt.option_id)));
    } catch (error) {
      this._logger.errorMessage(`Error updating options for chart ${chartId}: ${error.message}`);
    }
  }

  /**
   * Creates a new layout with the provided data.
   * @param {object} newLayout - The layout data to create.
   * @returns {Promise<object>} The created layout.
   * @throws {Error} If the layout creation fails.
   */
  async createLayout(newLayout) {
    try {
      const { id, name, description, displayTimestamp, autoTabChange, isOfficial, owner_id, tabs } = newLayout;
      const foundLayoutOwner = await this._userRepository.findUserById(owner_id);
      if (!foundLayoutOwner) {
        throw new Error('Layout owner not found');
      }
      await this._layoutRepository.createLayout({
        id,
        name,
        description,
        display_timestamp: displayTimestamp,
        auto_tab_change_interval: autoTabChange,
        owner_username: foundLayoutOwner.username,
        is_official: isOfficial,
      });
      for (const tab of tabs) {
        const { name: tabName, columns, objects, id: tabId } = tab;
        await this._tabsRepository.createTab({
          id: tabId,
          name: tabName,
          layout_id: newLayout.id,
          column_count: columns,
        });

        for (const object of objects) {
          const { id: chartId, x, y, h, w, name: objectName, options, ignoreDefaults } = object;

          await this._gridTabCellRepository.createGridTabCell({
            chart_id: chartId,
            row: x,
            col: y,
            row_span: w,
            col_span: h,
            tab_id: tabId,
          });

          await this._chartRepository.createChart({
            id: chartId,
            object_name: objectName,
            ignore_defaults: ignoreDefaults,
          });

          const optionIds = await Promise.all(options.map(async (option) => {
            const foundOption = await this._optionRepository.findOptionByName(option);
            if (!foundOption) {
              throw new Error(`Option ${option} not found`);
            }
            return foundOption.id;
          }));

          await Promise.all(optionIds.map((optionId) => this._chartOptionsRepository.createChartOption({
            chart_id: chartId,
            option_id: optionId,
          })));
        }
      }
      return newLayout;
    } catch (error) {
      this._logger.errorMessage(`Error creating layout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a layout by its ID.
   * @param {string} layoutId  - The ID of the layout to delete.
   * @throws {Error} If the layout is not found or if an error occurs during deletion.
   * @returns {string} LayoutId of deleted layout
   */
  async deleteLayout(layoutId) {
    try {
      const rowsAffected = await this._layoutRepository.deleteLayout(layoutId);
      if (!rowsAffected || rowsAffected !== 1) {
        throw new Error(`Layout with id: ${layoutId} not found`);
      }
      return layoutId;
    } catch (error) {
      this._logger.errorMessage(`Error deleting layout: ${error.message}`);
      throw error;
    }
  }
}
