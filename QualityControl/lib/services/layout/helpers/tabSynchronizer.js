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

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/tab-synchronizer`;
import { LogManager } from '@aliceo2/web-ui';

/**
 * @typedef {import('../../database/repositories/TabRepository').TabRepository} TabRepository
 * @typedef {import('./gridTabCellSynchronizer.js').GridTabCellSynchronizer} GridTabCellSynchronizer
 */

export class TabSynchronizer {
  /**
   * Creates an instance of TabSynchronizer to synchronize tabs for a layout.
   * @param {TabRepository} tabRepository - The repository for tab operations.
   * @param {GridTabCellSynchronizer} gridTabCellSynchronizer - The synchronizer for grid tab cells.
   * @returns {void}
   */
  constructor(tabRepository, gridTabCellSynchronizer) {
    this._tabRepository = tabRepository;
    this._gridTabCellSynchronizer = gridTabCellSynchronizer;
    this._logger = LogManager.getLogger(LOG_FACILITY);
  }

  /**
   * Synchronizes the tabs for a given layout.
   * @param {number} layoutId - The ID of the layout to synchronize tabs for.
   * @param {Array<object>} tabs - The array of tab objects to synchronize.
   * @param {object} transaction - The database transaction object.
   * @throws {Error} If an error occurs during synchronization.
   * @returns {Promise<void>}
   */
  async sync(layoutId, tabs, transaction) {
    const incomingIds = tabs.filter((t) => t.id).map((t) => t.id);
    const existingTabs = await this._tabRepository.findTabsByLayoutId(layoutId, { transaction });
    const existingIds = existingTabs.map((t) => t.id);

    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
    for (const id of idsToDelete) {
      try {
        const deletedCount = await this._tabRepository.deleteTab(id, { transaction });
        if (deletedCount === 0) {
          throw new Error(`Tab with id=${id} not found for deletion`);
        }
      } catch (error) {
        this._logger.errorMessage(`Failed to delete tabId=${id}: ${error.message}`);
      }
    }

    for (const tab of tabs) {
      tab.layout_id = layoutId;
      try {
        if (tab.id && existingIds.includes(tab.id)) {
          await this._tabRepository.updateTab(tab.id, tab, { transaction });
        } else {
          const tabRecord = await this._tabRepository.createTab(tab, { transaction });
          if (!tabRecord) {
            throw new Error('Failed to create tab');
          }
        }
        if (tab.objects && tab.objects.length) {
          await this._gridTabCellSynchronizer.sync(tab.id, tab.objects, transaction);
        }
      } catch (error) {
        this._logger.errorMessage(`Failed to upsert tab (id=${tab.id ?? 'new'}): ${error.message}`);
        await transaction.rollback();
        throw error;
      }
    }
  }
}
