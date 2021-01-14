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
    this.getTaskList = RemoteData.notAsked();
  }

  /** 
   * Loads list of running tasks from AliECS Core
   */
  async initTasks() {
    this.getTaskList = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post('/api/GetTasks');
    if (!ok) {
      this.getTaskList = RemoteData.failure(result.message);
      this.model.notification.show(`Unable to retrieve list of tasks`, 'danger', 2000);
    } else {
      this.getTaskList = RemoteData.success(this.prepareData(result));
    }   
    this.notify();
  }

  /**
   * Prepare data for taks table
   * @param {object} data - raw data
   */
  prepareData(data) {
    var taskTable = {};
    for (let item of data.tasks) {
      if (!taskTable.hasOwnProperty(item.deploymentInfo.hostname)) {
        taskTable[item.deploymentInfo.hostname] = [];
      }
      taskTable[item.deploymentInfo.hostname].push({
        name: item.className.substring(item.className.lastIndexOf("/") + 1, item.className.lastIndexOf("@")),
        state: item.state,
        pid: item.pid,
        locked: item.locked
      })
    }
    return taskTable;
  }

  /**
   * Initialize page and request data
   */
  getTasks() {
    this.initTasks();
  }
}
