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
import { getTasksByFlp } from '../../common/utils.js';
import { TaskTableModel } from '../../common/task/TaskTableModel.js';
import { jsonDelete } from '../../utilities/jsonDelete.js';
import { jsonGet } from '../../utilities/jsonGet.js';
import { jsonPost } from '../../utilities/jsonPost.js';

/**
 * Model for the taskList page
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

    this.cleanUpRequest = RemoteData.notAsked();

    this.detectorPanels = RemoteData.notAsked(); // JSON containing information on detectors panels; isOpened, list of hosts

    this.taskTableModel = new TaskTableModel(model);
    this.taskTableModel.bubbleTo(this);
  }

  /**
   * Initialize task page by requesting detectors and hosts for each detector
   */
  async init() {
    this.refreshInterval = setInterval(async () => {
      if (!this.model.loader.active) {
        await this.initTasks();
      }
    }, COG.REFRESH_TASK);

    this.cleanUpRequest = RemoteData.notAsked();
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
   * Update the UI with state request elements and send an HTTP DELETE request for tasks to be cleaned up
   * Notify the user of the result
   * @return {void}
   */
  async cleanUpTasks() {
    this.cleanUpRequest = RemoteData.loading();
    this.notify();

    try {
      const detectors = Object.keys(this.detectorPanels.payload) ?? [];
      const { killedTasks } = await jsonDelete('/api/tasks', { body: { detectors } });
      this.cleanUpRequest = RemoteData.success(`A total of: ${killedTasks?.length ?? 0} tasks have been cleaned`);
    } catch (error) {
      this.cleanUpRequest = RemoteData.failure(error.message);
    } 
    this.notify();
  }

  /**
   * Update the UI with state request elements and send an HTTP POST deployment request for template 'resources-cleanup'
   * @return {void}
   */
  async cleanUpResources() {
    this.cleanUpRequest = RemoteData.loading();
    this.notify();

    try {
      const detectors = Object.keys(this.model.detectors.hostsByDetectorRemote.payload);
      const hosts = Object.values(this.model.detectors.hostsByDetectorRemote.payload).flat();
      await jsonPost(
        `/api/deploy`,
        { body: { template: 'resources-cleanup', detectors, userVars: { hosts: JSON.stringify(hosts) } } }
      );
      this.cleanUpRequest = RemoteData.success('Cleanup Resources environment has been successfully requested');
    } catch (error) {
      this.cleanUpRequest = RemoteData.failure(error.message);
    }
    this.notify();
  }
}
