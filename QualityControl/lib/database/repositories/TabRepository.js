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
   * @param {string} layoutId - The ID of the layout to find associated tabs for.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of tab objects.
   */
  async findTabsByLayoutId(layoutId) {
    return await this._model.findAll({
      where: { layout_id: layoutId },
    });
  }

  /**
   * Saves a new tab.
   * @param {object} tab - The tab data to save.
   * @throws Will throw an error if the creation fails.
   */
  async createTab(tab) {
    const [createdRows] = await this._model.create(tab);
    if (createdRows === 0) {
      throw new Error('Failed to create tab');
    }
  }

  /**
   * Updates an existing tab.
   * @param {object} updatedTab - The tab data to update.
   * @param {string} tabId - The ID of the tab to update.
   * @throws Will throw an error if the update fails.
   */
  async updateTab(updatedTab, tabId) {
    const [updatedRows] = await this._model.update(
      updatedTab,
      {
        where: { id: tabId },
      },
    );
    if (updatedRows === 0) {
      throw new Error('Failed to update tab');
    }
  }

  /**
   * Deletes a tab by its ID.
   * @param {string} tabId - The ID of the tab to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  async deleteTab(tabId) {
    const [deletedRows] = await this._model.destroy({ where: { id: tabId } });
    if (deletedRows === 0) {
      throw new Error('Failed to delete tab');
    }
  }
}
