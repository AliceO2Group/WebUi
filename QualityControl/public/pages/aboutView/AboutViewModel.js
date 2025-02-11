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

import { Observable, RemoteData } from '/js/src/index.js';

/**
 * Model representing About View
 */
export default class AboutViewModel extends Observable {
  /**
   * Initialize `items` to an empty object
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;
    this.items = {};
  }

  /**
   * Load info about the framework into `items` for each service
   * @param {Array} services - Array of services from which to retrieve the status
   * @returns {undefined}
   */
  async getServiceStatus(services) {
    services.forEach((service) => {
      this.items[service] = RemoteData.loading();
    });
    this.notify();

    for (const service of services) {
      const { result, ok } = await this.model.loader.get(`/api/status/${service}`);
      if (!ok) {
        this.items[service] = RemoteData.failure(result.message);
        this.model.notification.show(`Unable to retrieve information for ${service}`, 'danger', 2000);
      } else {
        this.items[service] = RemoteData.success(result);
      }
    }
    console.log(this.items);
    this.notify();
  }
}
