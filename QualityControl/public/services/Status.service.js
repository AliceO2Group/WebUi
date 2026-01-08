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
 * @typedef {object} ServicePayload
 * @property {object} [bookkeeping] - Configuration for the Bookkeeping service.
 * @property {string} bookkeeping.BASE_URL - The root URL of the Bookkeeping application.
 * @property {string} bookkeeping.PARTIAL_RUN_DETAILS - The URL path/query parameters for run details.
 */

export default class StatusService {
  /**
   * Initialize service
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    this.model = model;
    this.loader = model.loader;

    /**
     * @type {RemoteData<ServicePayload>}
     */
    this.serviceConfig = RemoteData.notAsked();

    this.initStatusService();
  }

  /**
   * Fetches service configurations from the backend and updates the internal state.
   * Notifies the model once the request completes (success or failure).
   * @returns {Promise<void>}
   */
  async initStatusService() {
    const { result, ok } = await this.loader.get('api/services');
    if (ok) {
      this.serviceConfig = RemoteData.success(result || {});
    } else {
      this.serviceConfig = RemoteData.failure('Error retrieving services');
    }

    this.model.notify();
  }

  /**
   * Checks if a specific service configuration is successfully loaded and available.
   * @param {string} service - The name of the service to check (e.g. 'bookkeeping').
   * @returns {boolean} - True if the service key exists in a successful payload.
   */
  isConfigured(service) {
    return this.serviceConfig.match({
      Success: (config) => Object.hasOwn(config, service),
      Other: () => false,
    });
  }

  /**
   * Constructs a full URL for the bookkeeping run details page.
   * @param {string|number} runNumber - The specific run identifier to append to the URL.
   * @returns {string|undefined} The formatted URL, or `undefined` if the service is not configured.
   */
  buildBookkeepingUrl(runNumber) {
    if (!this.isConfigured('bookkeeping')) {
      return;
    }
    const { BASE_URL, PARTIAL_RUN_DETAILS } = this.serviceConfig.payload.bookkeeping;
    return `${BASE_URL}/${PARTIAL_RUN_DETAILS}${runNumber}`;
  }
}
