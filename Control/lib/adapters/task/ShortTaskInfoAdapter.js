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

const { TaskState } = require('../../common/taskState.enum.js');
const { TaskStatus } = require('../../common/taskStatus.enum.js');
const { getTaskShortName } = require('./getTaskShortName.js')

/**
 * ShortTaskInfoAdapter - Given an AliECS Task, construct a TaskInfo object for GUI purposes
 */
class ShortTaskInfoAdapter {
  /**
   * ShortTaskInfoAdapter
   */
  constructor() {}

  /**
   * Converts the given proto object ShortTaskInfo (o2control.proto) to an entity object.
   *
   * @param {ShortTaskInfo - o2control.prot} task - object to convert
   * @returns {TaskInfo} entity of a task with needed information
   */
  static toEntity(task) {
    const {
      name,
      locked,
      taskId,
      status,
      state = TaskState.UNKNOWN,
      className,
      deploymentInfo,
      pid,
      sandboxStdout,
      critical = false, // set to false by default to workaround the lack of optional usage in proto
    } = task;

    /**
     * @type {TaskInfo}
     */
    const taskInfo = {
      id: taskId,
      taskId,
      name: getTaskShortName(name),
      locked,
      hostname: deploymentInfo?.hostname ?? '',
      status: status ?? TaskStatus.UNDEFINED,
      state: (state === TaskState.ERROR && critical) ? TaskState.ERROR_CRITICAL : state,
      className,
      pid,
      sandboxStdout,
      isCritical: critical
    };

    return taskInfo;
  }

}

module.exports.ShortTaskInfoAdapter = ShortTaskInfoAdapter;
