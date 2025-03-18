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
 * @typedef TaskEvent
 * @source {Ev_TaskEvent} - events.proto
 * 
 * TaskEvent type definition as parsed following the received message from the ECS Kafka task topic
 * The parsing is done based on the object received from ECS in `events.proto` definition
 *
 * @property {String} name - task name, based on the of the task class
 * @property {String} taskId - task id, unique
 * @property {String} state - state machine for the task
 * @property {String} status - active/inactive
 * @property {String} hostname - hostname of the machine where the task is running
 * @property {String} className - class name of the task from which it was planned
 * @property {Object} traits
 * @property {String} environmentId - the id of the environment that the run belongs to
 * @property {String} path - path to the parent taskRole of this task within the same environment
 * 
 * @example
 * 
*  "taskEvent": {
 *    "name": "github.com/AliceO2Group/ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753#2t3dVbgcVS8",
 *    "taskid": "2t3dVbgcVS8",
 *    "state": "CONFIGURED",
 *    "hostname": "guis-2",
 *    "status": "ACTIVE"
 *    "className": "github.com/AliceO2Group/ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753",
 *    "environmentId": "2t3dVb527hz",
 *    "path": "readout-dataflow.host-guis-2.readout"
 *  }
 */
