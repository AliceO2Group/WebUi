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

import {Observable, RemoteData} from '/js/src/index.js';

const INTEGRATED_SERVICE_LABEL = 'INTEG_SERVICE';

/**
 * Model representing About page
 */
export default class About extends Observable {
  /**
   * Initialize services with their keys and corresponding paths
   * @param {Model} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.services = {
      apricot: 'apricot',
      core: 'core',
      consul: 'consul',
      grafana: 'grafana',
      gui: 'gui',
      [INTEGRATED_SERVICE_LABEL]: 'core/services',
      notification: 'notification',
    };

    this.statuses = {
      error: {},
      success: {},
      loading: {},
      notEnabled: {},
    };
  }

  /**
   * Retrieve information on all AliECS GUI dependent services
   * @returns {void}
   */
  async retrieveInfo() {
    for (const key in this.services) {
      this.retrieveServiceStatus(key, this.services[key])
    }
    this.retrieveWsInfo();
  }

  /**
   * Method to retrieve the status of a service given its key and path to query;
   * If the service is part of AliECS integrated services, then:
   * * status of previous integrated services is removed
   * * a general loading state is added as we are not aware what services we will retrieve
   * * on success, all services are added back into the status map
   * @param {string} key
   * @param {string} path - e.g. core/services
   */
  async retrieveServiceStatus(key, path) {
    this._removeServiceFromMap(key);
    this.statuses.loading[key] = RemoteData.loading();  // adds general loading state of integrated services
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/status/${path}`);
    delete this.statuses.loading[key];

    if (!ok) {
      this.statuses.error[key] = RemoteData.failure({
        name: key, status: {configured: true, ok: false, message: result.message}
      });
    } else {
      this._addServicesToMap(key, result);
    }
    this.notify();
  }

  /**
   * Update the status of the WSClient in the statuses objects used by the about component
   */
  retrieveWsInfo() {
    this.statuses.ws = RemoteData.loading();
    this.notify();
    if (this.model.ws.connection.readyState === WebSocket.OPEN) {
      this.setWsInfo({status: {ok: true, configured: true}, message: 'WebSocket connection is alive'});
    } else {
      this.setWsInfo({status: {ok: false, configured: true, message: 'Cannot establish connection to the server'}});
    }
  }

  /**
   * Method to allow the update of WS connection while not being on the about page
   * @param {object} info 
   */
  setWsInfo(info) {
    this.statuses.ws = RemoteData.success({name: 'WebSocket Service', ...info});
    this.notify();
  }

  /**
   * Given a status of a service, return the category to which it belongs
   * @param {boolean} isConfigured 
   * @param {boolean} isOk 
   * @returns {'notEnabled'|'error'|'success'}
   */
  _getCategoryOnStatus(isConfigured, isOk) {
    if (!isConfigured) {
      return 'notEnabled';
    } else if (!isOk) {
      return 'error';
    }
    return 'success';
  }

  /**
   * Given a service key, remove its pair from the status map per category;
   * If the key represents AliECS Integrated Services, then all belonging services are removed
   * @param {string} serviceKey - key of the service to be removed
   * @returns {void}
   */
  _removeServiceFromMap(serviceKey) {
    for (const category in this.statuses) {
      if (serviceKey === INTEGRATED_SERVICE_LABEL) {
        Object.keys(this.statuses[category])
          .filter((name) => name.startsWith(INTEGRATED_SERVICE_LABEL))
          .forEach((name) => delete this.statuses[category][name]);
      } else {
        delete this.statuses[category][serviceKey];
      }
    }
  }

  /**
   * Given a Map of services, add it to the list of queried services
   * @param {string} key - key of the service
   * @param {Service|Map<String,Service>} services - map of services to be added
   * @returns {void}
   */
  _addServicesToMap(key, services) {
    if (key === INTEGRATED_SERVICE_LABEL) {
      Object.entries(services)
        .forEach(([name, service]) => this._addServiceToMap(`${INTEGRATED_SERVICE_LABEL}-${name}`, service));
    } else {
      this._addServiceToMap(key, services);
    }
  }

  /**
   * Add a service to the current list of statuses enquired
   * @param {string} key 
   * @param {Service} service - to be added
   */
  _addServiceToMap(key, service) {
    const {status: {ok, configured}} = service;
    const category = this._getCategoryOnStatus(configured, ok);
    this.statuses[category][key] = RemoteData.success(service);
  }
}
