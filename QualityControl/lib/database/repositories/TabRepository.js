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

import { BaseRepository } from './BaseRepository.js';

export class TabRepository extends BaseRepository {
  constructor(tabModel, layoutModel) {
    super(tabModel);
    this._layoutModel = layoutModel;
  }

  /**
   * Retrieves all tabs associated with a specific layout ID.
   * @async
   * @param {string} layoutId - The ID of the layout to find associated tabs for.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of tab objects.
   */
  async findTabsByLayoutId(layoutId) {
    try {
      const tabs = await this.findAllByFilters({
        layout_id: layoutId });
      return tabs;
    } catch (error) {
      this._logger.errorMessage(`Error finding tabs by layout ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a tab by its ID.
   * @async
   * @param {string} tabId - The ID of the tab to retrieve.
   * @returns {Promise<object|null>} A promise that resolves to the tab object or null if not found.
   */
  async findTabById(tabId) {
    try {
      return await this.findById(tabId);
    } catch (error) {
      this._logger.errorMessage(`Error finding tabs by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves the layout associated with a tab ID.
   * @async
   * @param number
   * @param {string} tabId - The ID of the tab to find the associated layout for.
   * @returns {Promise<object|null>} A promise that resolves to the layout object or null if not found.
   */
  async findLayoutByTabId(tabId) {
    try {
      const tab = await this._model.findOne({
        where: { id: tabId },
        include: [{ model: this._layoutModel, as: 'layout' }],
        nest: true,
      });
      return tab ? tab.layout : null;
    } catch (error) {
      this._logger.errorMessage(`Error finding layout by tab ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Saves a new tab.
   * @async
   * @param {object} tab - The tab data to save.
   * @returns {Promise<object>} The saved tab object.
   */
  async saveTab(tab) {
    try {
      return await this.create(tab);
    } catch (error) {
      this._logger.errorMessage(`Error saving tab: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an existing tab.
   * @async
   * @param {object} updatedTab - The tab data to update.
   * @param {string} tabId - The ID of the tab to update.
   * @returns {Promise<number>} The number of affected rows.
   */
  async updateTab(updatedTab, tabId) {
    try {
      const affectedRows = await this.update(tabId, updatedTab);
      if (affectedRows === 0) {
        throw new Error('Tab not found or no changes made');
      }
    } catch (error) {
      this._logger.errorMessage(`Error updating tab: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a tab by its ID.
   * @async
   * @param {string} tabId - The ID of the tab to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   * @throws {Error} - Throws an error if there is an issue during the deletion.
   */
  async deleteTab(tabId) {
    try {
      const deletedRows = await this.delete(tabId);
      if (deletedRows === 0) {
        throw new Error('Tab not found');
      }
      return;
    } catch (error) {
      this._logger.errorMessage(`Error deleting tab: ${error.message}`);
      throw error;
    }
  }
}
