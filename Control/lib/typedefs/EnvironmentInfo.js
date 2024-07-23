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
 * @typedef EnvironmentInfo
 *
 * EnvironmentInfo type definition as parsed and sent to the client by the GUI server
 * The parsing is done based on the object received from ECS in `o2control.proto` definition
 * @property {string} id
 * @property {number} currentRunNumber
 * @property {number} createdWhen - timestamp in ms
 * @property {string} state - STANDBY, DEPLOYED, CONFIGURED, RUNNING, ERROR, MIXED, SHUTDOWN
 * @property {string} currentTransition - DEPLOY, CONFIGURE, RESET, START_ACTIVITY, STOP_ACTIVITY, EXIT, GO_ERROR, RECOVER AS PER https://github.com/AliceO2Group/Control/blob/master/core/environment/environment.go#L143
 * @property {string} rootRole - workflow selected by user
 * @property {string} description
 * @property {number} numberOfFlps
 * @property {number} numberOfHosts
 * @property {number} numberOfTasks - number of tasks running on FLPs
 * @property {Map<[qc, epn, flp, trg], object>} hardware - a map of counters per component of their tasks (FLP, EPN, QC, TRIGGER, ALL)
 * @property {Array<string>} includedDetectors - list of detectors part of the environment
 * @property {Map<string, string>} defaults - map of variables that are set as defaults and their values
 * @property {Map<string, string>} vars - map of all variables that are set and their values
 * @property {Map<string, string>} userVars - map of user set variables and their values
 * @property {Map<string, object>} [integratedServicesData] - map of integrated services such as Bookkeeping, ODC, CCDB, etc.
 * @property {Array<ShortTaskInfo>} [tasks] - a list of minimum tasks information
 */
