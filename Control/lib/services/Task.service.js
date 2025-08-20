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

const {LogManager, grpcErrorToNativeError} = require('@aliceo2/web-ui');
const { ShortTaskInfoAdapter } = require('../adapters/task/ShortTaskInfoAdapter');

/**
 * @class
 * TaskService class to be used for retrieving and sending requests on tasks from ECS:
 */
class TaskService {
  /**
   * @constructor
   * Constructor for configuring the service to retrieve data via passed services
   * @param {GrpcServiceClient<o2control>} grpcClient - gRPC client based on o2control.proto
   */
  constructor(grpcClient) {
    /**
     * @type {GrpcServiceClient<o2control>}
     */
    this._grpcClient = grpcClient;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/task-service`);
  }

  /**
   * Uses the grpc interface to retrieve the information on a task by its ID by calling `GetTask`
   * @param {string} taskId - ID of the task to retrieve
   * @return {Promise<TaskInfo>}
   * @rejects
   */
  async getTaskById(taskId) {
    try {
      const { task } = await this._grpcClient.GetTask({ taskId });
      // needs adapter
      return task;
    } catch (grpcError) {
      throw grpcErrorToNativeError(grpcError);
    }
  }

  /**
   * Uses the gRPC Interface to retrieve the information by calling `GetTasks`
   * No parameters are to be provided
   * @return {Promise<Array<ShortTaskInfo>>}
   */
  async getTaskList() {
    try {
      const { tasks } = await this._grpcClient.GetTasks();
      return tasks.map((task) => ShortTaskInfoAdapter.toEntity(task));
    } catch (grpcError) {
      throw grpcErrorToNativeError(grpcError);
    }
  }

  /**
   * Uses the gRPC Interface to clean up tasks by calling `CleanUpTasks`
   * No parameters are to be provided
   * @return {Promise<{killedTasks: Array<ShortTaskInfo>, runningTasks: Array<ShortTaskInfo>}>}
   */
  async cleanUpTasks() {
    try {
      const { killedTasks, runningTasks } = await this._grpcClient.CleanUpTasks();
      const killedTasksAdapted = killedTasks.map((task) => ShortTaskInfoAdapter.toEntity(task));
      const runningTasksAdapted = runningTasks.map((task) => ShortTaskInfoAdapter.toEntity(task));
      return { killedTasks: killedTasksAdapted, runningTasks: runningTasksAdapted };
    } catch (grpcError) {
      throw grpcErrorToNativeError(grpcError);
    }
  }
}

module.exports = {TaskService};
