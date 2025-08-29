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

import { RunStatus } from '../../library/runStatus.enum.js';
import { RemoteData } from '/js/src/index.js';

/**
 * Service to get the data to populate the filters
 */
export default class FilterService {
  /**
   * Initialize filterModel
   * @param {FilterModel} filterModel - The root filterModel that manages filter state
   */
  constructor(filterModel) {
    this.filterModel = filterModel;
    this.loader = filterModel.model.loader;

    this.runTypes = RemoteData.notAsked();
  }

  /**
   * Method to get all run types to show in the filter
   * @returns {RemoteData} - result within a RemoteData object
   */
  async getRunTypes() {
    this.runTypes = RemoteData.loading();
    this.filterModel.notify();
    const { result, ok } = await this.loader.get('/api/filter/configuration');
    if (ok) {
      this.runTypes = RemoteData.success(result?.runTypes || []);
    } else {
      this.runTypes = RemoteData.failure('Error retrieving runTypes');
    }
    this.filterModel.notify();
  }

  /**
   * Method to get run status for a specific run number
   * @param {number} runNumber - The run number to get status for
   * @returns {Promise<string>} - Run status string
   */
  async getRunStatus(runNumber) {
    try {
      const parsedRunNumber = parseInt(runNumber, 10);

      if (Number.isNaN(parsedRunNumber)) {
        return RunStatus.UNKNOWN;
      }

      const { result, ok } = await this.loader.get(`/api/filter/run-status/${parsedRunNumber}`);

      if (!ok || !result || !Object.values(RunStatus).includes(result)) {
        return RunStatus.UNKNOWN;
      }

      return result;
    } catch {
      return RunStatus.UNKNOWN;
    }
  }

  /**
   * Method to initialize the filter service
   * @returns {void}
   */
  async initFilterService() {
    await this.getRunTypes();
  }
}
