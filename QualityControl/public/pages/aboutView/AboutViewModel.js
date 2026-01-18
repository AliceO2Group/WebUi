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

import { ServiceStatus } from '../../../library/enums/Status/serviceStatus.enum.js';
import { IntegratedServices } from '../../../library/enums/Status/integratedServices.enum.js';
import { RemoteData } from '/js/src/index.js';
import { BaseViewModel } from '../../common/abstracts/BaseViewModel.js';

/**
 * Model representing About View
 */
export default class AboutViewModel extends BaseViewModel {
  /**
   * Initialize `services` to an empty object
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;
    this.services = {};
    for (const state of Object.values(ServiceStatus)) {
      this.services[state] = {};
    }
  }

  /**
   * Load info about the framework into `services` for each service
   * @returns {Promise<void>}
   */
  async retrieveAllServicesStatus() {
    for (const service of Object.values(IntegratedServices)) {
      this.retrieveIndividualServiceStatus(service);
    }
  }

  /**
   * Retrieve status of a specific service
   * @param {string} service - name of the service to retrieve status for
   * @returns {Promise<void>}
   */
  async retrieveIndividualServiceStatus(service) {
    try {
      this.services[ServiceStatus.LOADING][service] = RemoteData.loading();
      this.notify();

      const { result, ok } = await this.model.loader.get(`/api/status/${service}`);
      delete this.services[ServiceStatus.LOADING][service];
      this.notify();

      if (!ok) {
        this.services[ServiceStatus.ERROR][service] = RemoteData.failure({
          name: service,
          status: { ok: false, category: ServiceStatus.ERROR, message: result.message },
        });
      } else {
        const { status: { category } } = result;
        this.services[category][service] = RemoteData.success(result);
      }
      this.notify();
    } catch (error) {
      this.model.notification.show(`Error fetching data for ${service}: ${error.message}`, 'danger', 2000);
    }
  }

  /**
   * Iterates through all known {@link ServiceStatus} values and returns the
   * first matching service found. This assumes that a given service can exist
   * in at most one {@link ServiceStatus} at a time.
   * @param {string} service - The service identifier to look up
   * @returns {RemoteData|undefined} - The service instance under any `ServiceStatus`, or `undefined` if not found.
   */
  findService(service) {
    for (const status of Object.values(ServiceStatus)) {
      if (this.services[status][service]) {
        return this.services[status][service];
      }
    }
    return undefined;
  }
}
