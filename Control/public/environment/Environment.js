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
import {jsonDelete} from './../utilities/jsonDelete.js';
import {jsonPut} from './../utilities/jsonPut.js';
import { TaskTableModel } from './../common/task/TaskTableModel.js';

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

    this.taskTableModel = new TaskTableModel(model);
    this.taskTableModel.bubbleTo(model);

    this.model = model;
    this.requests = RemoteData.notAsked();
    this.list = RemoteData.notAsked();
    this.item = RemoteData.notAsked();
    this.itemControl = RemoteData.notAsked();
    this.itemNew = RemoteData.notAsked();

    this.isExpanded = {
      userVars: true,
      vars: false,
      defaults: false,
    };
  }

  /**
   * Load all environments into `list` as RemoteData
   */
  async getEnvironments() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/environments`);
    this.list = !ok ? RemoteData.failure(result.message) : RemoteData.success(result);
    this.notify();
  }


  /**
   * Remove environment request
   */
  async removeEnvironmentRequest(id) {
    this.requests = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/core/removeRequest/${id}`);
    this.requests = !ok ? RemoteData.failure(result.message) : RemoteData.success(result);
    this.notify();
  }

  /**
   * Get environments requests
   */
  async getEnvironmentRequests() {
    this.requests = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/requests`);
    this.requests = !ok ? RemoteData.failure(result.message) : RemoteData.success(result);
    this.notify();
  }
  /**
   * Load one environment into `item` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async getEnvironment(body, itShouldLoad = true, panel = '') {
    if (itShouldLoad) {
      this.item = RemoteData.loading();
    } else if (this.item.isSuccess()) {
      // Clear tasks to avoid flickering or bad display when switching from EPN to FLP
      this.item.payload.tasks = RemoteData.loading();
    }
    this.notify();

    const { result, ok } = await this.model.loader.get(`/api/environment/${body.id}/${panel}`);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
    } else {
      result.tasks = RemoteData.success(result.tasks);
      this.item = RemoteData.success(result);
    }
    this.itemControl = RemoteData.notAsked();
    this.notify();
  }

  /**
   * Request the control of an environment to transition to a new state. 
   * In case of success, the user will be redirected to the environment details page with the new state
   * In case of failure, an error message which be stored in `itemControl` and displayed under the button action panel
   * @param {String} id - environmentId that the user whishes to control
   * @param {String} type - type of the transition that the user whishes to apply
   * @param {Number} runNumber - current run number if the environment is in RUNNING state
   * @return {void}
   */
  async controlEnvironment(id, type, runNumber) {
    this.itemControl = RemoteData.loading();
    this.notify();

    try {
      const result = await jsonPut(`/api/environment/${id}`, {body: {id, type, runNumber}});
      this.itemControl = RemoteData.success(result);
      this.model.router.go(`?page=environment&id=${result.id}`);
    } catch (error) {
      this.itemControl = RemoteData.failure(error);
    }
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

    const {result, ok} = await this.model.loader.post(`/api/core/request`, itemForm);
    this.itemNew = !ok ? RemoteData.failure(result.message) : RemoteData.notAsked();
    this.model.router.go(`?page=environments`);
  }

  /**
   * Destroy a remote environment, store action result into `this.itemControl` as RemoteData
   * @param {String} id - id of the environment to be destroyed
   * @param {Number} runNumber - if environment is in running state
   * @param {Boolean} [allowInRunningState = false] - if the environment should be allowed to stop in running state
   * @param {Boolean} [force = false] - if the environment should be killed via force flag
   */
  async destroyEnvironment(id, runNumber, allowInRunningState, force) {
    this.itemControl = RemoteData.loading();
    this.notify();

    try {
      await jsonDelete(`/api/environment/${id}`, {body: {id, runNumber, allowInRunningState, force}});
      this.itemControl = RemoteData.notAsked();
      this.model.router.go(`?page=environments`);
    } catch (error) {
      this.model.notification.show(error.message, 'danger', 5000);
      this.itemControl = RemoteData.failure(error.message);
      this.notify();
    }
  }

  /**
   * Save configuration of the new environment page
   * @param {JSON} data - configuration to be saved
   */
  async saveEnvConfiguration(data, action = 'save') {
    this.itemNew = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.model.loader.post(`/api/core/environments/configuration/${action}`, data, true);
    if (!ok) {
      this.model.notification.show(result.message, 'danger', 10000);
      this.itemNew = RemoteData.failure(result.message);
    } else {
      this.model.notification.show(result.message, 'success', 3000);
      this.itemNew = RemoteData.success(result.message);
    }
    this.notify();
  }

  /**
   * If the user has the environment page opened and there is an 
   * @param {EnvironmentInfo} environments - partial env info from AliECS via WebSocket message
   */
  updateItemEnvironment(environments) {
    if (this.item.isSuccess()) {
      const {id, currentTransition} = this.item.payload;
      let envExists = false;
      environments.forEach((env) => {
        if (env.id === id) {
          envExists = true;
          if (!env.currentTransition) {
            env.currentTransition = undefined;
          }
          delete env.tasks;
          Object.assign(this.item.payload, env);
          this.notify();
          if (currentTransition && !env.currentTransition) {
            this.getEnvironment({id}, false);
          }
          return;
        }
      });
      if (!envExists) {
        this.item = RemoteData.failure('Environment was destroyed');
      }
    }
  }
}
