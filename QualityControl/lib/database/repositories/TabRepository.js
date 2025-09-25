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

import { BaseRepository } from './BaseRepository.js';

/**
 * @typedef {object} TabAttributes
 * @property {string} id
 * @property {string} name
 * @property {string} layout_id
 * @property {number} column_count
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * Repository for managing tabs.
 */
export class TabRepository extends BaseRepository {
  /**
   * Creates an instance of the TabRepository
   * @param {typeof Tab} tabModel - Sequelize Tab model
   */
  constructor(tabModel) {
    super(tabModel);
  }

  /**
   * Finds all tabs by layout ID
   * @param {string} layoutId id of the layout
   * @returns {Promise<TabAttributes[]>}
   */
  async findTabsByLayoutId(layoutId) {
    return this.model.findAll({ where: { layout_id: layoutId } });
  }

  /**
   * Creates a new tab
   * @param {Partial<TabAttributes>} tabData new tab
   * @returns {Promise<TabAttributes>}
   */
  async createTab(tabData) {
    return this.model.create(tabData);
  }

  /**
   * Updates an existing tab by ID
   * @param {string} id id of the tab
   * @param {Partial<TabAttributes>} updateData updated tab
   * @returns {Promise<number>} Number of updated rows
   */
  async updateTab(id, updateData) {
    const [updatedCount] = await this.model.update(updateData, { where: { id } });
    return updatedCount;
  }

  /**
   * Deletes a tab by ID
   * @param {string} id id of the tab
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteTab(id) {
    return this.model.destroy({ where: { id } });
  }
}
