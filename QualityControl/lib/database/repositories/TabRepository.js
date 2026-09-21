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

import { UniqueConstraintError } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import { InvalidInputError } from '@aliceo2/web-ui';

/**
 * @typedef {object} TabAttributes
 * @property {number} id - UUID
 * @property {string} name - name of the tab
 * @property {number} layout_id - ID of the associated layout
 * @property {number} column_count - number of columns in the tab
 * @property {Date} created_at - timestamp when the tab was created
 * @property {Date} updated_at - timestamp when the tab was last updated
 */

/**
 * Repository for managing tabs.
 */
export class TabRepository extends BaseRepository {
  constructor(tabModel) {
    super(tabModel);
  }

  /**
   * Finds all tabs by layout ID
   * @param {string} layoutId id of the layout
   * @param {object} options additional options for the query (e.g. transaction)
   * @returns {Promise<TabAttributes[]>} List of tabs found
   */
  async findTabsByLayoutId(layoutId, options = {}) {
    return super.findAll({ where: { layout_id: layoutId }, ...options });
  }

  /**
   * Creates a new tab
   * @param {Partial<TabAttributes>} tabData new tab
   * @param {object} options - Sequelize options (e.g., transaction)
   * @returns {Promise<TabAttributes>} The created tab
   */
  async createTab(tabData, options = {}) {
    try {
      const createdTab = await super.create(tabData, options);
      return createdTab;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const message = `A tab with name "${tabData.name}" already exists for layout ID "${tabData.layout_id}".`;
        throw new InvalidInputError(message);
      }
      throw error;
    }
  }

  /**
   * Updates an existing tab by ID
   * @param {string} id id of the tab
   * @param {Partial<TabAttributes>} updateData updated tab
   * @param {object} options - Sequelize options (e.g., transaction)
   * @returns {Promise<number>} Number of updated rows
   */
  async updateTab(id, updateData, options = {}) {
    try {
      const updatedCount = await super.update(id, updateData, { ...options });
      return updatedCount;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const message = `A tab with name "${updateData.name}" already exists for layout ID "${updateData.layout_id}".`;
        throw new InvalidInputError(message);
      }
      throw error;
    }
  }
}
