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
    this.cleanUpRequest = RemoteData.notAsked();
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
      this.tasksByFlp = RemoteData.success(getTasksByFlp(result.tasks));
    }   
    this.notify();
  }

  /**
   * Clean up tasks
   */
  async cleanUpTasks() {
    this.cleanUpRequest = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post('/api/CleanupTasks');
    if (!ok) {
      this.cleanUpRequest = RemoteData.failure(result.message);
      this.model.notification.show(`Unable to clean up tasks: ${result.message}`, 'danger', 2000);
    } else {
      this.cleanUpRequest = RemoteData.success();
      this.model.notification.show(`Tasks have been cleaned`, 'success');
      this.model.router.go('?page=taskList');
    }
    this.notify();
  }

  /**
   * Initialize page and request data
   */
  getTasks() {
    this.initTasks();
  }
}
