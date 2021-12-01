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

    this.detectorPanel = {}; // JSON in which the state of detector panels
    this.cruToggleByHost = {}; // JSON in which the state of displayed information is saved
    this.cruToggleByCruEndpoint = {}; // JSON in which it is saved the current state of the cru by endpoint panels
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
    if (this.model.detectors.listRemote.isSuccess()) {
      const isOpen = this.model.detectors.selected !== 'GLOBAL';
      this.model.detectors.listRemote.payload.forEach((detector) => this.detectorPanel[detector] = {isOpen});
    }
  }

  /**
   * Select/Deselect passed host
   * @param {String} host
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
   * Given a detector, toggle the selection of all of its hosts
   * @param {String}
   */
  toggleHostsByDetectorSelection(detector) {
    const hostsWithCru = this._getHostsWithCRUForDetector(detector);
    if (this.areAllHostsForDetectorSelected(detector)) {
      this.selectedHosts = this.selectedHosts.filter((host) => !hostsWithCru.includes(host));
    } else {
      this.selectedHosts = this.selectedHosts.concat(hostsWithCru.filter((host) => !this.selectedHosts.includes(host)));
    }
    this.notify();
  }

  /**
   * Give a detector name, use the hosts of the detector and check if all of them are present in selected hosts
   * @param {String} detector
   * @returns {boolean}
   */
  areAllHostsForDetectorSelected(detector) {
    const hostsWithCru = this._getHostsWithCRUForDetector(detector);
    return hostsWithCru.every((host) => this.selectedHosts.includes(host));
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
      this.selectedHosts.forEach((host) => copy[host] = this._getMinifiedHostInfo(host));
      const {result, ok} = await this.model.loader.post(`/api/consul/crus/config/save`, copy);
      if (!ok) {
        result.ended = true;
        result.success = false;
        this.configurationRequest = RemoteData.failure(result.message);
      } else {
        result.ended = true;
        result.success = true;
        this.configurationRequest = RemoteData.success(result);
      }
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
        {channelId: this.channelId, hosts, operation: 'o2-roc-config'}
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
    return `${consul.protocol}://${consul.hostname}:${consul.port}/${consul.kVPrefix}/${consul.readoutCardPath}`;
  }

  /**
   * Given a host, take it by cru by endpoint and build a json containing only
   * data that can be modified via the GUI
   * Currently we only set links0-12 and user logic
   * @param {String} host
   * @returns {JSON}
   */
  _getMinifiedHostInfo(host) {
    const hostCopy = {};
    Object.keys(this.cruMapByHost.payload[host]).forEach((cruEndpointKey) => {
      const cruEndpointCopy = {
        cru: {userLogicEnabled: this.cruMapByHost.payload[host][cruEndpointKey].config.cru.userLogicEnabled},
      };
      Object.keys(this.cruMapByHost.payload[host][cruEndpointKey].config)
        .filter((key) => key.match('link[0-9]{1,2}')) // select only fields from links0 to links11
        .forEach((key) => {
          const cruConfig = this.cruMapByHost.payload[host][cruEndpointKey].config;
          cruEndpointCopy[key] = {};
          if (cruConfig[key] && cruConfig[key].enabled) {
            cruEndpointCopy[key].enabled = cruConfig[key].enabled
          }
        });
      hostCopy[cruEndpointKey] = {config: cruEndpointCopy};
    })
    return JSON.parse(JSON.stringify(hostCopy));
  }

  /**
   * Given a detector name, use the hosts per detector and the cry map by host to build a list of hosts
   * that belong to a detector and contain a CRU
   * @param {String} detector 
   * @returns {Array<String>}
   */
  _getHostsWithCRUForDetector(detector) {
    const hostsForDetector = this.model.detectors.hostsByDetectorRemote.payload[detector];
    return hostsForDetector.filter((host) => Object.keys(this.cruMapByHost.payload).includes(host));
  }
}
