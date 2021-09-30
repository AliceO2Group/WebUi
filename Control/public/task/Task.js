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

    this.scrollTop = 0;

    this.detectorPanels = RemoteData.notAsked(); // JSON containing information on detectors panels; isOpened, list of hosts
  }

  /** 
   * Loads list of running tasks from AliECS Core
   * In global view close all detector panels while in single view open that respective panel
   */
  async initTasks() {
    this.detectorPanels = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post('/api/GetTasks');
    if (!ok) {
      this.detectorPanels = RemoteData.failure(result.message);
    } else {
      const tasksByFlpMap = getTasksByFlp(result.tasks);
      if (this.model.detectors.isSingleView()) {
        const singleDetector = {};
        singleDetector[this.model.detectors.selected] = {
          isOpened: false,
          list: RemoteData.loading()
        }
        this.detectorPanels = RemoteData.success(singleDetector);
        this._groupTasksByFlpAndDetector(tasksByFlpMap, [this.model.detectors.selected])
      } else {
        if (!this.model.detectors.listRemote.isSuccess()) { // request detectors list only if it was not initially
          await this.model.detectors.getAndSetDetectorsAsRemoteData();
        }
        if (this.model.detectors.listRemote.isSuccess()) {
          const initDetectorPanels = {};
          this.model.detectors.listRemote.payload.forEach((detector) => {
            initDetectorPanels[detector] = {
              isOpened: false,
              list: RemoteData.loading()
            }
          });
          this.detectorPanels = RemoteData.success(initDetectorPanels);
          this.notify();
          this._groupTasksByFlpAndDetector(tasksByFlpMap, this.model.detectors.listRemote.payload);
        } else {
          this.detectorPanels = RemoteData.failure('Unable to load detectors from AliECS');
        }
      }
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
    this.initTasks();
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
   * Given a list of tasks (with host information) and a list of hosts per detector,
   * group the tasks and return a new map with tasks belonging to hosts belonging to detectors
   * @param {Map<String, JSON>} tasks
   * @param {Map<String, Array<String>>} detectors
   */
  async _groupTasksByFlpAndDetector(tasksByFlp, detectors) {
    detectors.map(async (detector) => {
      let hosts;
      hosts = await this.model.detectors.getHostsForDetector(detector, hosts, this);
      if (hosts.isSuccess()) {
        const taskCopy = JSON.parse(JSON.stringify(tasksByFlp));
        Object.keys(taskCopy)
          .filter((host) => !hosts.payload.includes(host))
          .forEach((host) => delete taskCopy[host]);
        this.detectorPanels.payload[detector] = {
          list: RemoteData.success(taskCopy),
          isOpened: true
        };
      } else {
        this.detectorPanels.payload[detector] = {
          list: RemoteData.failure(`Unable to retrieve the list of hosts for detector: ${detector}`),
          isOpened: true
        };
      }
      this.notify();
    })
  }
}
