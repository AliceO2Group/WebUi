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
import {getTasksByFlp} from './../common/utils.js';

/**
 * Model representing Tasks
 */
export default class Task extends Observable {
  /** 
   * Initialize remoteData items to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();
    this.model = model;
    this.tasksByFlp = RemoteData.notAsked();

    this.cleanUpTasksRequest = RemoteData.notAsked();
    this.cleanUpResourcesRequest = RemoteData.notAsked();
    this.cleanUpResourcesID = 0;

    this.detectorPanels = RemoteData.notAsked(); // JSON containing information on detectors panels; isOpened, list of hosts
  }

  /**
   * Initialize task page by requesting detectors and hosts for each detector
   */
  async initTaskPage() {
    this.detectorPanels = RemoteData.loading();
    this.notify();

    if (this.model.detectors.hostsByDetectorRemote.isSuccess()) {
      // Build the hostsByDetectorMap
      const hostsByDetectorMap = {};
      const detectors = this.model.detectors.hostsByDetectorRemote.payload;
      Object.keys(detectors).map((detector) => {
        const hosts = detectors[detector];
        const hostsMap = {};
        hosts.forEach((host) => hostsMap[host] = {}); // initialize to empty for future tasks to be added
        hostsByDetectorMap[detector] = {isOpened: false, list: RemoteData.success(hostsMap)};
      });
      this.detectorPanels = RemoteData.success(hostsByDetectorMap);
      this.notify();
    } else {
      this.detectorPanels = RemoteData.failure('Unable to load detectors from AliECS');
      this.notify();
    }
    this.initTasks();
  }

  /** 
   * Loads list of running tasks from AliECS Core
   * In global view close all detector panels while in single view open that respective panel
   */
  async initTasks() {
    const {result, ok} = await this.model.loader.post('/api/GetTasks');
    if (!ok) {
      this.detectorPanels = RemoteData.failure(result.message);
    } else if (this.detectorPanels.isSuccess()) {
      const detectorsMap = this.detectorPanels.payload;
      const tasksByFlpMap = getTasksByFlp(result.tasks);
      Object.keys(detectorsMap).forEach((detector) => {
        const detectorJSON = detectorsMap[detector];
        if (detectorJSON.list.isSuccess()) {
          Object.keys(detectorJSON.list.payload).forEach((host) => {
            detectorJSON.list.payload[host] = tasksByFlpMap[host]
          });
        }
      });
      this.detectorPanels = RemoteData.success(detectorsMap)
    }
    this.notify();
  }

  /**
   * Clean up tasks
   */
  async cleanUpTasks() {
    this.cleanUpTasksRequest = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post('/api/CleanupTasks');
    if (!ok) {
      this.cleanUpTasksRequest = RemoteData.failure(result.message);
      this.model.notification.show(`Unable to clean up tasks: ${result.message}`, 'danger', 2000);
    } else {
      this.cleanUpTasksRequest = RemoteData.success();
      this.model.notification.show(`Tasks have been cleaned`, 'success');
      this.model.router.go('?page=taskList');
    }
    this.notify();
  }

  /**
   * Clean up resources request
   */
  async cleanUpResources() {
    this.cleanUpResourcesRequest = RemoteData.loading();
    this.notify();

    this.cleanUpResourcesID = (Math.floor(Math.random() * (999999 - 100000) + 100000)).toString();
    const {result, ok} = await this.model.loader
      .post(`/api/clean/resources`, {channelId: this.cleanUpResourcesID});
    if (!ok) {
      this.cleanUpResourcesRequest = RemoteData.failure(result.message);
    } else {
      this.cleanUpResourcesRequest = RemoteData.success(result);
    }
    this.notify();
  }

  /**
   * Initialize page and request data
   * Adds an automatic refresh of the content if another request is not ongoing already
   */
  async getTasks() {
    this.initTaskPage();
    this.refreshInterval = setInterval(async () => {
      if (!this.model.loader.active) {
        await this.initTasks();
      }
    }, COG.REFRESH_TASK);
  }

  /**
   * Method to update the message with regards to the `CleanResources` command
   * If message id will match the user's it will be displayed
   * @param {WebSocketMessagePayload} req 
   */
  setResourcesRequest(message) {
    const messageId = message.id || '';
    if (this.cleanUpResourcesID.toString() === messageId.toString()) {
      if (message.success) {
        this.cleanUpResourcesRequest = RemoteData.success(message);
      } else {
        this.cleanUpResourcesRequest = RemoteData.success(message);
      }
      this.notify();
    }
  }

  /**
   * Check that for a given map of hosts there is at least one host
   * containing at least 1 task
   * @param {JSON} data 
   */
  areTasksInDetector(data) {
    return Object.keys(data)
      .some((host) => data[host] && data[host].list && data[host].stdout && data[host].list.length > 0);
  }
}
