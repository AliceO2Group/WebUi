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
 * @typedef EnvironmentEvent
 *
 * EnvironmentEvent type definition as parsed following the received message from the ECS Kafka environment topic
 * The parsing is done based on the object received from ECS in `events.proto` definition
 *
 * @property {String} id
 * @property {String} state - STANDBY, DEPLOYED, CONFIGURED, RUNNING, ERROR, MIXED, SHUTDOWN
 * @property {Number} runNumber - only when the environment is in the running state
 * @property {Error} error - any error that occurred during the transition
 * @property {String} message - any additional message concerning the current state or transition
 * @property {String} transition - DEPLOY, CONFIGURE, RESET, START_ACTIVITY, STOP_ACTIVITY, EXIT, GO_ERROR, RECOVER AS PER https://github.com/AliceO2Group/Control/blob/master/core/environment/environment.go#L143 
 * @property {String} transitionStep - the current step of the transition as defined in ControlWorkflows
 * @property {String} transitionStatus - the status of the transition as defined in ControlWorkflows
 * @property {Map<String, String>} vars - map of all variables that are set and their values
 * @property {User.proto} lastRequestUser - the user that requested the last transition
 */
