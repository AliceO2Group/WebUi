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
    if (Boolean(this._openedTaskViews[taskId])) {
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
