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

import { Observable, RemoteData } from '/js/src/index.js';
import { jsonPost } from './../../utilities/jsonPost.js';
import { TASK_STATES } from '../enums/TaskState.js';

/**
 * Model representing tasks within a table
 */
export class TaskTableModel extends Observable {
  /**
   * Initializes model with default values
   * @param {Model} model - reference to the main model
   */
  constructor(model) {
    super();

    this._model = model;
    this._openedTaskViews = {}; // map of the view states of the tasks. If present, task view is open
    this._tasksAsRemoteDataById = {}; // map of (taskId, RemoteData) fetched for in-depth details of the task

    this._filterBy = {
      state: [],
      name: new RegExp()
    };
  }

  /**
   * Checks whether the filter for a specified state is enabled
   * @param {string} state - state to check
   * @return {boolean} - true if the filter is enabled, false otherwise
   */
  isFilterStateEnabled(state) {
    return this._filterBy.state.includes(state);
  }

  /**
   * Toggles the filter state for a specified state
   * @param {TaskState} state - state to toggle
   */
  toggleFilterState(state) {
    if (TASK_STATES.includes(state)) {
      if (this._filterBy.state.includes(state)) {
        this._filterBy.state = this._filterBy.state.filter((filterState) => filterState !== state);
      } else {
        this._filterBy.state.push(state);
      }
      this.notify();
    }
  }

  /**
   * Given a user input value, filters the tasks by name
   * @param {string} name - name to filter by
   */
  setFilterByName(name) {
    this._filterBy.name = new RegExp(`.*${name}.*`);
    this.notify();
  }

  /**
   * Checks whether a task matches the current filter
   * @param {TaskInfo} task - task to check
   * @return {boolean} - true if the task matches the filter, false otherwise
   */
  doesTaskMatchFilter(task) {
    let doesStateMatch = true;
    if (this._filterBy.state.length !== 0) {
      doesStateMatch = this._filterBy.state.includes(task.state);
    }

    let doesNameMatch = true;
    if (this._filterBy.name) {
      const nameToMatch = task.name ?? task.path;
      doesNameMatch = this._filterBy.name.test(nameToMatch);
    }
    return doesStateMatch && doesNameMatch;
  }

  /**
   * Getter for retrieving the view state of the tasks
   * @return {object<id: string, isOpen: boolean} - view state of the tasks
   */
  get openedTaskViews() {
    return this._openedTaskViews;
  }

  /**
   * Getter for retrieving the tasks as RemoteData by their id
   * @return {object<id: string, data: RemoteData>} - task as RemoteData by their id
   */
  get tasksAsRemoteDataById() {
    return this._tasksAsRemoteDataById;
  }

  /**
   * Toggle by task id the state of open/close to display in-depth details of a task
   * @param {string} taskId
  */
  async toggleTaskView(taskId) {
    if (this._openedTaskViews[taskId]) {
      delete this._openedTaskViews[taskId];
      this.notify();
      return;
    }
    this._openedTaskViews[taskId] = true;
    this._getTaskById({ taskId: taskId });
  }

  /**
   * Method to make a POST HTTP Request to get all details about a task by its Id
   * @param {object} body - {taskId: string}
   */
  async _getTaskById(body) {
    const { taskId } = body;
    this.tasksAsRemoteDataById[taskId] = RemoteData.loading();
    this.notify();

    try {
      const result = await jsonPost(`/api/GetTask`, { body });
      const { task } = result;
      const commandInfo = this._parseTaskInfo(task, taskId);
      this.tasksAsRemoteDataById[taskId] = RemoteData.success(commandInfo);
    } catch (error) {
      this.tasksAsRemoteDataById[taskId] = RemoteData.failure(error.message);
    }
    this.notify();
  }

  /**
   * Method to add & remove fields regarding the task
   * @param {object} taskInfo - task command info
   * @param {string} taskId - task id for which to parse the command info
   * @return {object} - parsed command info
   */
  _parseTaskInfo(task, taskId) {
    const commandInfo = task.commandInfo;
    delete commandInfo.shell;
    commandInfo.env = commandInfo.env.join('\n');
    commandInfo.arguments = commandInfo.arguments.join(' ');
    commandInfo.taskId = taskId;

    commandInfo.className = task.shortInfo.className;
    commandInfo.mesosLog = task.shortInfo.sandboxStdout;
    return commandInfo;
  }
}
