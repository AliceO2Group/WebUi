/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * TaskInfoAdapter - Given an AliECS Task, construct a TaskInfo object for GUI purposes
 */
class TaskInfoAdapter {
  /**
   * TaskInfoAdapter
   */
  constructor() {}

  /**
   * Converts the given proto object (o2control.proto) to an entity object.
   * @param {TaskInfoProto} task - object to convert
   * @returns {TaskInfo} entity of a task with needed information
   */
  static toEntity(task) {
    const {
      taskId,
      name,
      locked,
      status,
      state,
      className,
      pid,
      sandboxStdout,
    } = task;

    /**
     * @type {TaskInfo}
     */
    const taskInfo = {
      id: taskId,
      taskId,
      name: TaskInfoAdapter.getShortName(name),
      locked,
      status,
      state,
      className,
      pid,
      sandboxStdout,
    };

    return taskInfo;
  }

  /**
   * Method to parse a given full task name and return the small version of it
   * @param {string} taskName - full name of the task
   * @returns {string} short name of the task
   */
  static getShortName(taskName) {
    const regex = new RegExp('tasks/.*@');
    const matchedTaskName = taskName.match(regex);
    if (matchedTaskName) {
      taskName = matchedTaskName[0].replace('tasks/', '').replace('@', '');
    }
    return taskName;
  }
}

module.exports = TaskInfoAdapter;
