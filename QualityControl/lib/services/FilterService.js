/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { LogManager } from '@aliceo2/web-ui';
const logger = LogManager.getLogger('filter/service');

/**
 * High level service that composes, processes and maps data from the bookkeeping service
 */
export class FilterService {
  /**
   * Creates an instance of FilterService to map and expose data from the bookkeeping service.
   * @param {BookkeepingService} bookkeepingService - Low level data provider fetching raw data from the BKP source
   */
  constructor(bookkeepingService) {
    this._bookkeepingService = bookkeepingService;
    this._runTypes = [];
    this.initFilters();
  }

  /**
   * This method is used to initialize the filter service
   * @returns {Promise<void>} - resolves when the filter service is initialized
   */
  async initFilters() {
    await this._bookkeepingService.connect();
    await this.getRunTypes();
  }

  /**
   * This method is used to retrieve the list of run types from the bookkeeping service
   * @returns {Promise<void>} - resolves when the list of run types is available
   */
  async getRunTypes() {
    try {
      if (!this._bookkeepingService.active) {
        return;
      }
      const rawRunTypes = await this._bookkeepingService.retrieveRunTypes();
      this._runTypes = [];
      for (const type of rawRunTypes) {
        this._runTypes.push(type?.name);
      }
      this._runTypes.sort();
    } catch (error) {
      logger.errorMessage(`Error while retrieving run types: ${error.message || error}`);
      this._runTypes = [];
    }
  }

  /**
   * This method is used to initialize the filter service
   * @returns {string[]} - resolves when the filter service is initialized
   */
  get runTypes() {
    return [...this._runTypes];
  }
}
