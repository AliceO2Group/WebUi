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
import { getTasksByFlp } from '../common/utils.js';
import { TaskTableModel } from '../common/task/TaskTableModel.js';
import { jsonDelete } from '../utilities/jsonDelete.js';
import { jsonGet } from '../utilities/jsonGet.js';
import { jsonPost } from '../utilities/jsonPost.js';

/**
 * Model representing Tasks
 */
export default class TaskPageModel extends Observable {
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

    this.detectorPanels = RemoteData.notAsked(); // JSON containing information on detectors panels; isOpened, list of hosts

    this.taskTableModel = new TaskTableModel(model);
    this.taskTableModel.bubbleTo(this);
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
    try {
      const taskList = await jsonGet('/api/tasks');
      if (this.detectorPanels.isSuccess()) {
        const detectorsMap = this.detectorPanels.payload;
        const tasksByFlpMap = getTasksByFlp(taskList);
        Object.keys(detectorsMap).forEach((detector) => {
          const detectorJSON = detectorsMap[detector];
          if (detectorJSON.list.isSuccess()) {
            Object.keys(detectorJSON.list.payload).forEach((host) => {
              detectorJSON.list.payload[host] = tasksByFlpMap[host]
            });
          }
        });
        this.detectorPanels = RemoteData.success(detectorsMap);
      }
    } catch (error) {
      this.detectorPanels = RemoteData.failure(error.message);
    }
    this.notify();
  }

  /**
   * Clean up tasks
   */
  async cleanUpTasks() {
    this.cleanUpTasksRequest = RemoteData.loading();
    this.notify();

    try {
      const detectors = Object.keys(this.detectorPanels.payload) ?? [];
      const { killedTasks } = await jsonDelete('/api/tasks', { body: { detectors } });
      this.cleanUpTasksRequest = RemoteData.success();
      this.model.notification.show(`A total of: ${killedTasks?.length ?? 0} tasks have been cleaned`, 'success');
      this.model.router.go('?page=taskList');
    } catch (error) {
      this.cleanUpTasksRequest = RemoteData.failure(error.message);
      this.model.notification.show(`Unable to clean up tasks: ${error.message}`, 'danger', 4000);
    } 
    this.notify();
  }

  /**
   * Clean up resources request
   */
  async cleanUpResources() {
    this.cleanUpResourcesRequest = RemoteData.loading();
    this.notify();

    try {
      const detectors = Object.keys(this.model.detectors.hostsByDetectorRemote.payload);
      const hosts = Object.values(this.model.detectors.hostsByDetectorRemote.payload).flat();
      const result = await jsonPost(`/api/deploy`, { body: { template: 'resources-cleanup', detectors, userVars: { hosts: JSON.stringify(hosts) } } });
      this.cleanUpResourcesRequest = RemoteData.success(result);
    } catch (error) {
      this.cleanUpResourcesRequest = RemoteData.failure(error.message);
    }
    this.notify();
  }

  /**
   * Initialize page and request data
   * Adds an automatic refresh of the content if another request is not ongoing already
   * * TODO: Remote Task Interval and rely on kafka [OGUI-1151]
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
   * Check that for a given map of hosts there is at least one host
   * containing at least 1 task
   * @param {JSON} data 
   */
  areTasksInDetector(data) {
    return Object.keys(data)
      .some((host) => data[host] && data[host].list && data[host].stdout && data[host].list.length > 0);
  }
}
