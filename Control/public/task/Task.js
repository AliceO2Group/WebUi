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
  }

  /** 
   * Loads list of running tasks from AliECS Core
   */
  async initTasks() {
    this.tasksByFlp = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post('/api/GetTasks');
    if (!ok) {
      this.tasksByFlp = RemoteData.failure(result.message);
      this.model.notification.show(`Unable to retrieve list of tasks`, 'danger', 2000);
    } else {
      const tasksByFlpMap = getTasksByFlp(result.tasks);
      this.tasksByFlp = RemoteData.success(tasksByFlpMap);
      this.model.notification.show('Tasks updated', 'success', 1000);
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
   */
  getTasks() {
    this.initTasks();
    this.taskRefreshInterval = setInterval(() => this.initTasks(), COG.REFRESH_TASK);
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
}
