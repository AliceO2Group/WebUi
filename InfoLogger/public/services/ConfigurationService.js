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
 * Service providing global app configuration
 */
class ConfigurationService extends Observable {
  /**
   * ConfigurationService constructor
   */
  constructor(model) {
    super();
    this._model = model;
    this._configuration = RemoteData.notAsked();
  }

  /**
   * Load the app configuration
   *
   * @return {void}
   */
  async load() {
    this._configuration = RemoteData.loading();
    this.notify();

    const { result, ok } = await this._model.loader.get('/api/configuration');

    this._configuration = ok ? RemoteData.success(result) : RemoteData.failure(result);
    this.notify();
  }

  /**
   * Return the configuration as RemoteData
   *
   * @return {RemoteData>} the configuration as RemoteData
   */
  get configuration() {
      return this._configuration;
  }
}; 

export { ConfigurationService };
