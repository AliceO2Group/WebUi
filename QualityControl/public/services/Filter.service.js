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

import { RemoteData } from '/js/src/index.js';

/**
 * Service to get the data to populate the filters
 */
export default class FilterService {
  /**
   * Initialize model
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    this.model = model;
    this.loader = model.loader;

    this.runTypes = RemoteData.notAsked();
  }

  /**
   * Method to get all run types to show in the filter
   * @returns {RemoteData} - result within a RemoteData object
   */
  async getRunTypes() {
    this.runTypes = RemoteData.loading();
    this.model.notify();
    const { result, ok } = await this.loader.get('/api/runTypes');
    if (ok) {
      this.runTypes = RemoteData.success(result);
    } else {
      this.runTypes = RemoteData.failure('Error retrieving runTypes');
    }
    this.model.notify();
  }

  /**
   * Method to initialize the filter service
   * @returns {void}
   */
  initFilterService() {
    this.getRunTypes();
  }
}
