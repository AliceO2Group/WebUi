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

/* global COG */

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
      gui: RemoteData.notAsked(),
      grafana: RemoteData.notAsked(),
      consul: RemoteData.notAsked(),
      kafka: RemoteData.notAsked(),
      apricot: RemoteData.notAsked(),
    };

    this.aliecs = RemoteData.notAsked();
    this.integratedServices = RemoteData.notAsked();

    this.consulServicesLink = '';
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
      this.getApricotInfo(),
      this.getConsulInfo(),
      this.getIntegratedServicesInfo(),
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
   * Make a request to retrieve information about Grafana
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
   * Make a request to retrieve information about Kafka
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
   * Make a request to retrieve information about Consul
   */
  async getConsulInfo() {
    this.statuses.consul = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/consul');
    if (!ok) {
      this.statuses.consul = RemoteData.failure(result.message);
    } else {
      this.statuses.consul = RemoteData.success(result);
      const CONSUL = COG.CONSUL;
      this.consulServicesLink = (CONSUL.kVPrefix && CONSUL.coreServices && result.hostname && result.port) ?
        `${result.hostname}:${result.port}/${CONSUL.kVPrefix}/${CONSUL.coreServices}/edit`
        : '';

    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about Apricot
   */
  async getApricotInfo() {
    this.statuses.apricot = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/apricot');
    if (!ok) {
      this.statuses.apricot = RemoteData.failure(result.message);
    } else {
      this.statuses.apricot = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about AliECS Core
   */
  async getCoreInfo() {
    this.aliecs = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/core');
    if (!ok) {
      this.aliecs = RemoteData.failure(result.message);
    } else {
      this.aliecs = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Make a request to retrieve information about the integrated services of AliECS CORE
   * e.g. dcs, ddsched, etc.
   */
  async getIntegratedServicesInfo() {
    this.integratedServices = RemoteData.loading();
    const {result, ok} = await this.model.loader.get('/api/status/core/services');
    if (!ok) {
      this.integratedServices = RemoteData.failure(result.message);
    } else {
      this.integratedServices = RemoteData.success(result);
    }
    this.notify();
  }
}
