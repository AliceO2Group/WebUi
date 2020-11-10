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
import Task from './Task.js';

/**
 * Model representing Environment CRUD
 */
export default class Environment extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.task = new Task(model);
    this.task.bubbleTo(model);

    this.model = model;
    this.list = RemoteData.notAsked();
    this.item = RemoteData.notAsked();
    this.itemControl = RemoteData.notAsked();
    this.itemNew = RemoteData.notAsked();
    this.plots = RemoteData.notAsked();

    this.expandUserVars = false;

    this.getPlotsList();
  }

  /**
   * Load all environments into `list` as RemoteData
   */
  async getEnvironments() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetEnvironments`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.success(result);
    this.notify();
  }

  /**
   * Load one environment into `item` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async getEnvironment(body) {
    this.item = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.model.loader.post(`/api/GetEnvironment`, body);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    await result.environment.tasks.forEach((task) => {
      this.task.getTaskById({taskId: task.taskId});
    });
    this.item = RemoteData.success(this.parseEnvResult(result));
    this.itemControl = RemoteData.notAsked(); // because item has changed
    this.notify();
  }

  /**
   * Method to remove and parse fields from environment result
   * @param {JSON} result
   * @return {JSON}
   */
  parseEnvResult(result) {
    result.environment.tasks.forEach((task) => {
      const regex = new RegExp(`tasks/.*@`);
      const tasksAndName = task.name.match(regex);
      if (tasksAndName) {
        task.name = tasksAndName[0].replace('tasks/', '').replace('@', '');
      }
    });

    return result;
  }

  /**
   * Control a remote environment, store action result into `itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async controlEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/ControlEnvironment`, body);
    if (!ok) {
      this.itemControl = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.success(result);
    this.itemNew = RemoteData.notAsked();
    this.model.router.go(`?page=environment&id=${result.id}`);
    this.notify();
  }

  /**
   * Create a new remote environment, creation action result into `itemNew` as RemoteData
   * See protobuf definition for properties of `itemForm` as body
   * @param {string} itemForm
   */
  async newEnvironment(itemForm) {
    this.itemNew = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/NewEnvironment`, itemForm);
    if (!ok) {
      this.itemNew = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemNew = RemoteData.notAsked();
    this.model.router.go(`?page=environment&id=${result.environment.id}`);
  }

  /**
   * Destroy a remote environment, store action result into `this.itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async destroyEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/DestroyEnvironment`, body);
    if (!ok) {
      this.model.notification.show(result.message, 'danger', 5000);
      this.itemControl = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.notAsked();
    this.model.router.go(`?page=environments`);
  }

  /**
   * Method to retrieve plots source list
   */
  async getPlotsList() {
    this.plots = RemoteData.loading();
    const {result, ok} = await this.model.loader.get(`/api/getPlotsList`);
    if (!ok) {
      this.plots = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.plots = RemoteData.success(result);
  }
}
