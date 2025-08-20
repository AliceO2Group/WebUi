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
const {LogManager, LogLevel, InvalidInputError, updateAndSendExpressResponseFromNativeError} = require('@aliceo2/web-ui');

/**
 * Controller for dealing with all API requests on tasks
 */
class TaskController {
  /**
   * Constructor for initializing controller of tasks
   * @param {TaskService} taskService - service to use to build information on tasks
   */
  constructor(taskService) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/task-ctrl`);

    /**
     * @type {TaskService}
     */
    this._taskService = taskService;
  }

  /**
   * API - GET endpoint for retrieving existing tasks as reported by ECS
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async getTaskListHandler(_, res) {
    let tasks;
    try {
      tasks = await this._taskService.getTasks();
      res.status(200).json(tasks);
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - GET endpoint for retrieving a specific task by its ID
   * @param {Request} req - HTTP Request object
   * @param {object} req.params - parameters of the request, including task ID
   * @param {string} req.params.id - ID of the task to retrieve
   * @param {Response} res - HTTP Response object
   */
  async getTaskHandler(req, res) {
    const { params: {id} = {} } = req;
    try {
      if (!id) {
        throw new InvalidInputError('Task ID is required');
      }

      const task = await this._taskService.getTaskById(id);
      res.status(200).json(task);
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - DELETE endpoint for cleaning up tasks
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   */
  async cleanUpTasksHandler(req, res) {
    try {
      const { session: { username } = {}} = req.session;
      this._logger.infoMessage(`CleanUpTasks request from ${username}`, {level: LogLevel.OPERATIONS});

      const { killedTasks, activeTasks } = await this._taskService.cleanUpTasks();
      res.status(200).json({killedTasks, activeTasks});
    } catch (error) {
      this._logger.errorMessage(error, {level: LogLevel.OPERATIONS});
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }
}

module.exports = {TaskController};
