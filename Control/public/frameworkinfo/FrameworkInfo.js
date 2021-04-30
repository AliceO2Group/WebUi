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
    this.statuses = {
      gui: RemoteData.notAsked()
    };
  }

  /**
   * Load ControlGUI and its dependencies data in control-remoteData
   */
  async getFrameworkInfo() {
    this.control = [];
    this.notify();

    Promise.allSettled([
      this.getGuiInfo(),
      this.getCoreInfo(),
      this.getGrafanaInfo(),
      this.getKafkaInfo(),
      this.getConsulInfo(),
    ]);
    this.notify();
  }

  /**
   * Make a request to retrieve information about the GUI
   */
  async getGuiInfo() {
    this.statuses.gui = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/gui');
    if (!ok) {
      this.statuses.gui = RemoteData.failure(result.message);
    } else {
      this.statuses.gui = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about the GUI
   */
  async getGrafanaInfo() {
    this.statuses.grafana = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/grafana');
    if (!ok) {
      this.statuses.grafana = RemoteData.failure(result.message);
    } else {
      this.statuses.grafana = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about the GUI
   */
  async getKafkaInfo() {
    this.statuses.kafka = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/kafka');
    if (!ok) {
      this.statuses.kafka = RemoteData.failure(result.message);
    } else {
      this.statuses.kafka = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about the GUI
   */
  async getConsulInfo() {
    this.statuses.consul = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/consul');
    if (!ok) {
      this.statuses.consul = RemoteData.failure(result.message);
    } else {
      this.statuses.consul = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about the GUI
   */
  async getCoreInfo() {
    this.statuses['AliECS Core'] = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/core');
    if (!ok) {
      this.statuses['AliECS Core'] = RemoteData.failure(result.message);
    } else {
      this.statuses['AliECS Core'] = RemoteData.success(result);
    }
    this.notify();
  }
}
