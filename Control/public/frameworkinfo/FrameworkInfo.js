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

/**
 * Model representing FrameworkInfo
 */
export default class FrameworkInfo extends Observable {
  /**
   * Initialize remoteData items to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.control = RemoteData.notAsked();
  }

  /**
   * Load ControlGUI and its dependencies data in control-remoteData
   */
  async getFrameworkInfo() {
    this.control = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get('/api/getFrameworkInfo');
    if (!ok) {
      this.control = RemoteData.failure(result.message);
      this.model.notification.show(`Unable to retrieve framework information`, 'danger', 2000);
    } else {
      this.control = RemoteData.success(result);
    }
    this.notify();
  }
}
