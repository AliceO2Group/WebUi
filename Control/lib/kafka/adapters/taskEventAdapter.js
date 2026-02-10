/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const { getTaskShortName } = require('../../adapters/task/getTaskShortName.js');
const { TaskState } = require('../../common/taskState.enum.js');
const { TaskStatus } = require('../../common/taskStatus.enum.js');
const { SourceEventTypes } = require('../enums/sourceEventsTypes.enum.js');

/**
 * Adapter for event messages received on run topic
 * @param {Event.proto} eventMessage - the event message to adapt
 * @param {Ev_TaskEvent.proto} eventMessage.taskEvent - the object describing the task event
 * @return {TaskEvent} - the adapted event message without the timestampNano field
 */
exports.taskEventAdapter = ({ taskEvent }) => {
  const { 
    name = '',
    taskid,
    state = TaskState.UNKNOWN,
    status = TaskStatus.UNDEFINED,
    hostname,
    className,
    traits: {
      critical = false, // set to false by default to workaround the lack of optional usage in proto
    } = {},
    environmentId,
  } = taskEvent;

  return {
    source: SourceEventTypes.ECS,
    id: taskid,
    taskId: taskid,
    name: getTaskShortName(name),
    hostname,
    status,
    state: (state === TaskState.ERROR && critical) ? TaskState.ERROR_CRITICAL : state,
    className,
    isCritical: critical,
    environmentId,
  }
};
