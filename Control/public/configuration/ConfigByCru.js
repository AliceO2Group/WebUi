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
 * Model representing Configuration CRUD
 */
export default class Config extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.cruMapByHost = RemoteData.notAsked();
    this.cruToggleByHost = {};
    this.cruToggleByCruEndpoint = {};

    this.configurationRequest = RemoteData.notAsked();
    this.channelId = 0;
  }

  /**
   *  HTTP Requests
   */

  /**
   * Method to retrieve a list of CRUs from Consul
   */
  async getCRUsConfig() {
    this.configurationRequest = RemoteData.notAsked();
    this.cruMapByHost = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/getCRUsConfig`);
    if (!ok) {
      this.cruMapByHost = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.addToggleOptions(result);
    this.cruMapByHost = RemoteData.success(result);
    this.notify();
  }

  /**
   * Method to send the new configuration to 
   * the server to save it in consul
   */
  async saveConfiguration() {
    this.configurationRequest = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/saveCRUsConfig`, this.cruMapByHost.payload);
    if (!ok) {
      result.ended = true;
      result.success = false;
      this.configurationRequest = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    result.ended = true;
    result.success = true;
    this.configurationRequest = RemoteData.success(result);
    this.notify();
  }

  /**
   * Makes a request to the server to run o2-roc-config workflow for all the hosts
   * in the table
   */
  async runRocConfigWorkflow() {
    this.configurationRequest = RemoteData.loading();
    this.notify();

    const hosts = Object.keys(this.cruMapByHost.payload);
    this.channelId = (Math.floor(Math.random() * (999999 - 100000) + 100000)).toString();
    const {result, ok} = await this.model.loader.post(`/api/execute/o2-roc-config`, {channelId: this.channelId, hosts});
    if (!ok) {
      this.configurationRequest = RemoteData.failure(result);
      this.notify();
      return;
    }
    this.configurationRequest = RemoteData.success(result);
    this.notify();
  }

  /**
   * Method to update the message with regards to the `o2-roc-config` command
   * If message id will match the client's it will be displayed
   * @param {WebSocketMessagePayload} message 
   */
  setConfigurationRequest(message) {
    const messageId = message.id || '';
    if (this.channelId.toString() === messageId.toString()) {
      if (message.success) {
        this.configurationRequest = RemoteData.success(message);
      } else {
        this.configurationRequest = RemoteData.success(message);
      }
      this.notify();
    }
  }

  /**
   * Helpers
   */

  /**
   * Build a map in which is saved:
   * * the state of a host panel with key: <host>
   * * the state of a cru-endpoint panel with key: <host>_<serial>_<endpoint>
   * true - opened; false - closed
   * @param {JSON} cruByHost
   */
  addToggleOptions(cruByHost) {
    Object.keys(cruByHost).forEach((host) => {
      this.cruToggleByHost[host] = true;
      Object.keys(cruByHost[host]).forEach((cruId) => this.cruToggleByCruEndpoint[`${host}_${cruId}`] = false);
    });
    this.notify();
  }
}
