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

    this.cruToggleByHost = {}; // JSON in which the state of displayed information is saved
    this.cruToggleByCruEndpoint = {};
    this.selectedHosts = [];

    this.configurationRequest = RemoteData.notAsked();
    this.failedTasks = [];
    this.channelId = 0;
  }

  /**
   * Initialize state
   */
  init() {
    this.failedTasks = [];
  }

  /**
   * Select/Deselect passed host
   * @param {string} host
   */
  toggleHostSelection(host) {
    const index = this.selectedHosts.findIndex((element) => host === element);
    if (index > -1) {
      this.selectedHosts.splice(index, 1);
    } else {
      this.selectedHosts.push(host);
    }
    this.notify();
  }

  /**
   * Select/Deselect all hosts based on current state of checkbox
   */
  toggleAllSelection() {
    const allSelected = this.selectedHosts.length === Object.keys(this.cruMapByHost.payload).length;
    this.selectedHosts = allSelected ? [] : Object.keys(this.cruMapByHost.payload);
    this.notify();
  }

  /**
   * Update the current selection with all hosts
   */
  selectAllHosts() {
    this.selectedHosts = Object.keys(this.cruMapByHost.payload);
  }

  /**
   * Enable/Disable all fields for UserLogic
   */
  toggleAllHostsUserLogicSelection() {
    if (this.cruMapByHost.isSuccess()) {
      const allULEnabled = this.areAllUserLogicsEnabled();
      Object.keys(this.cruMapByHost.payload).forEach((key) => {
        const cruByEndPoint = this.cruMapByHost.payload[key];
        Object.keys(cruByEndPoint)
          .filter((cruKey) => (cruByEndPoint[cruKey].config && cruByEndPoint[cruKey].config.cru))
          .forEach((cruKey) => cruByEndPoint[cruKey].config.cru.userLogicEnabled = allULEnabled ? 'false' : 'true');
      });
      this.selectAllHosts();
      this.notify();
    }
  }

  /**
   * Parse through the Map<String<Map<String,JSON>> which contains the data about CRUs by endpoint by hosts
   * and check if user logic is enabled on all
   * @returns {boolean}
   */
  areAllUserLogicsEnabled() {
    if (this.cruMapByHost.isSuccess()) {
      let allULEnabled = true;
      Object.keys(this.cruMapByHost.payload).forEach((key) => {
        const cruByEndPoint = this.cruMapByHost.payload[key];
        allULEnabled = !Object.keys(cruByEndPoint)
          .filter((cruKey) => (cruByEndPoint[cruKey].config && cruByEndPoint[cruKey].config.cru))
          .some((cruKey) => cruByEndPoint[cruKey].config.cru.userLogicEnabled === 'false')
      });
      return allULEnabled;
    }
    return false;
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

    const {result, ok} = await this.model.loader.get(`/api/consul/crus/config`);
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
   * Bundle the execution of:
   * * saving CRUs configuration in consul
   * * executing o2-roc-config through AliECS
   */
  async saveAndConfigureCRUs() {
    await this.saveConfiguration();
    if (this.configurationRequest.isSuccess()) {
      this.runRocConfigWorkflow();
    }
  }

  /**
   * Method to send the new configuration to 
   * the server to save it in consul
   */
  async saveConfiguration() {
    if (this.selectedHosts.length === 0) {
      this.model.notification.show('Please select hosts for which configuration should be saved', 'danger', 2000);
    } else {
      this.configurationRequest = RemoteData.loading();
      this.failedTasks = [];
      this.notify();
      const copy = {};
      this.selectedHosts.forEach((host) => copy[host] = JSON.parse(JSON.stringify(this.cruMapByHost.payload[host])));
      const {result, ok} = await this.model.loader.post(`/api/consul/crus/config/save`, copy);
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
    }
    this.notify();
  }

  /**
   * Makes a request to the server to run o2-roc-config workflow for all the hosts
   * in the table
   */
  async runRocConfigWorkflow() {
    if (this.selectedHosts.length === 0) {
      this.model.notification.show('Please select hosts for which o2-roc-config should be executed', 'danger', 2000);
    } else {
      this.configurationRequest = RemoteData.loading();
      this.failedTasks = [];
      this.notify();

      const hosts = this.selectedHosts;
      this.channelId = (Math.floor(Math.random() * (999999 - 100000) + 100000)).toString();
      const {result, ok} = await this.model.loader.post(`/api/execute/o2-roc-config`,
        {channelId: this.channelId, hosts}
      );
      if (!ok) {
        this.configurationRequest = RemoteData.failure(result);
        this.notify();
        return;
      }
      this.configurationRequest = RemoteData.success(result);
    }
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
      if (message.type === 'TASK') {
        this.failedTasks.push(message.info);
      } else {
        if (message.success) {
          this.configurationRequest = RemoteData.success(message);
        } else {
          this.failedTasks.push(message.info)
          this.configurationRequest = RemoteData.success(message);
        }
      }
    }
    this.notify();
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

  /**
   * Returns the URL of the location of stored configuration for CRUs
   * @returns {string}
   */
  getConsulConfigURL() {
    const consul = COG.CONSUL;
    return `//${consul.hostname}:${consul.port}/${consul.kVPrefix}/${consul.readoutCardPath}`
  }
}
