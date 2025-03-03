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
 * @typedef RunEvent
 *
 * RunEvent type definition as parsed following the received message from the ECS Kafka run topic
 * The parsing is done based on the object received from ECS in `events.proto` definition
 *
 * @property {String} environmentId - the id of the environment that the run belongs to
 * @property {Number} runNumber - only when the environment is in the running state
 * @property {String} state - STANDBY, DEPLOYED, CONFIGURED, RUNNING, ERROR, MIXED, SHUTDOWN
 * @property {Error} error - any error that occurred during the transition
 * @property {String} transition - DEPLOY, CONFIGURE, RESET, START_ACTIVITY, STOP_ACTIVITY, EXIT, GO_ERROR, RECOVER AS PER https://github.com/AliceO2Group/Control/blob/master/core/environment/environment.go#L143 
 * @property {String} transitionStatus - the status of the transition as defined in ControlWorkflows
 * 
 * @example
 * 
 *  "runEvent": {
 *    "environmentId": "2t3azvnUe8Q",
 *    "runNumber": 5,
 *    "state": "CONFIGURED",
 *    "transition": "START_ACTIVITY",
 *    "transitionStatus": "STARTED",
 *    "lastRequestUser": {
 *      "externalId": 0,
 *      "name": "anonymous"
 *    }
 *  }
 */
