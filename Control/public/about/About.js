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

    this.statuses = {};
  }

  /**
   * Load AliECSGUI and its dependencies data in control-remoteData
   * @returns {void}
   */
  async retrieveInfo() {
    this.services.forEach((key, path) => this.retrieveServiceState(key, path));
    this.retrieveWsInfo();
  }

  /**
   * Return a list of services that are in error state being either:
   * * RemoteData.failure - case in which the name and message is returned only
   * * Service in configured state but in failure - case in which full payload is returned
   * @returns {Array<{name, message}|Service>} - list of services
   */
  getInErrorServices() {
    return Object.entries(this.statuses)
      .filter(([_, value]) => {
        if (value.isFailure()) {
          return true;
        } else if (value.isSuccess()) {
          const {status: {ok, configured}} = value.payload;
          return configured && !ok;
        }
        return false;
      })
      .map(([name, value]) => {
        if (value.isFailure()) {
          return {
            name,
            message: this.statuses[name].payload.message
          };
        } else {
          return value.payload;
        }
      });
  }

  /**
   * Return a list of names of components in RemoteData.loading state
   * @returns {Array<string>}
   */
  getInLoadingComponents() {
    return Object.entries(this.statuses)
      .filter(([_, value]) => Boolean(value.isLoading()))
      .map(([name, _]) => name);
  }

  /**
   * Method to retrieve a list of Services from components in RemoteData.success and status.ok
   * @returns {Array<Service>}
   */
  getInSuccessServices() {
    return Object.entries(this.statuses)
      .filter(([_, value]) => Boolean(value.isSuccess()))
      .map(([_, value]) => value.payload)
      .filter((service) => service.status.ok & service.status.configured);
  }
  /**
   * Method to retrieve a list of components that are not enabled
   * @returns {Array<Service>}
   */
  getNotEnabledServices() {
    const t = Object.entries(this.statuses)
      .filter(([_, value]) => Boolean(value.isSuccess()))
      .filter(([_, value]) => !value.payload.status.configured)
      .map(([name, value]) => ({name, ...value.payload}))
    return t;
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
  async retrieveServiceState(key, path) {
    if (key === INTEGRATED_SERVICE_LABEL) {
      Object.keys(this.statuses)
        .filter((name) => name.startsWith(INTEGRATED_SERVICE_LABEL))
        .forEach((name) => delete this.statuses[name]); // remove status of existing components in case they were removed in the meantime
    }

    this.statuses[key] = RemoteData.loading();  // adds general loading state of integrated services
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/status/${path}`);

    if (!ok) {
      this.statuses[key] = RemoteData.failure(result.message);
    } else {
      if (key === INTEGRATED_SERVICE_LABEL) {
        Object.entries(result)
          .forEach(([name, service]) => {
            this.statuses[`${INTEGRATED_SERVICE_LABEL}-${name}`] = RemoteData.success(service);
          });
        delete this.statuses[key]; // removes general loading state of integrated services
      } else {
        this.statuses[key] = RemoteData.success(result);
      }
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
   * @param {JSON} info 
   */
  setWsInfo(info) {
    this.statuses.ws = RemoteData.success({name: 'WebSocket Service', ...info});
    this.notify();
  }
}
