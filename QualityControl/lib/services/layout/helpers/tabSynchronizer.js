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

import { NotFoundError } from '@aliceo2/web-ui';

/**
 * @typedef {import('../../database/repositories/TabRepository').TabRepository} TabRepository
 * @typedef {import('./gridTabCellSynchronizer.js').GridTabCellSynchronizer} GridTabCellSynchronizer
 */

export class TabSynchronizer {
  /**
   * Creates an instance of TabSynchronizer to synchronize tabs for a layout.
   * @param {TabRepository} tabRepository - The repository for tab operations.
   * @param {GridTabCellSynchronizer} gridTabCellSynchronizer - The synchronizer for grid tab cells.
   */
  constructor(tabRepository, gridTabCellSynchronizer) {
    this._tabRepository = tabRepository;
    this._gridTabCellSynchronizer = gridTabCellSynchronizer;
  }

  /**
   * Synchronizes the tabs of a layout with the provided list of tabs.
   * @param {string} layoutId - The ID of the layout whose tabs are to be synchronized.
   * @param {Array<object>} tabs - The list of tabs to synchronize.
   * @param {object} transaction - The database transaction object.
   */
  async sync(layoutId, tabs, transaction) {
    const existingTabs = await this._tabRepository.findTabsByLayoutId(layoutId, { transaction });
    const existingTabsByName = Object.fromEntries(existingTabs.map((t) => [t.name, t]));

    for (const tab of tabs) {
      tab.layout_id = layoutId;

      if (!tab.id && existingTabsByName[tab.name]) {
        tab.id = existingTabsByName[tab.name].id;
      }
    }

    const incomingNames = tabs.map((t) => t.name);
    const tabsToDelete = existingTabs.filter((t) => !incomingNames.includes(t.name));

    for (const tab of tabsToDelete) {
      const deletedCount = await this._tabRepository.delete(tab.id, { transaction });
      if (deletedCount === 0) {
        throw new NotFoundError(`Tab with id=${tab.id} not found for deletion`);
      }
    }

    for (const tab of tabs) {
      if (tab.id && existingTabsByName[tab.name]) {
        await this._tabRepository.updateTab(tab.id, tab, { transaction });
      } else {
        const tabRecord = await this._tabRepository.createTab(tab, { transaction });
        if (!tabRecord) {
          throw new Error('Failed to create new tab');
        }
        tab.id = tabRecord.id;
      }
      if (tab.objects && tab.objects.length) {
        await this._gridTabCellSynchronizer.sync(tab.id, tab.objects, transaction);
      }
    }
  }
}
