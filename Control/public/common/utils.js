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

import {ODC_STATE_COLOR} from './constants/stateColors.js';

/**
 * Method to display specific JSON fields in a particular way
 * @param {Object} item
 * @param {string} key
 * @return {string}
 */
const parseObject = (item, key) => {
  switch (key) {
    case 'trg_enabled':
      return item['trg_enabled'] === 'false' ? 'OFF'
        : (item['trg_global_run_enabled'] === "true" ? 'CTP' : 'LTU');
    case 'dcs_enabled':
    case 'ctp_readout_enabled':
    case 'dd_enabled':
      return item[key] && item[key] === 'true' ? 'ON' : 'OFF'
    case 'odc_topology':
      return _parseTopology(item);
    case 'tasks':
      return item.length;
    case 'version':
      return `${item.productName} v${item.versionStr}(revision ${item.build})`;
    case 'createdWhen':
    case 'run_start_time_ms':
    case 'run_end_time_ms':
      return item
        ? new Date(Number.parseInt(item)).toLocaleString()
        : '-';
    case 'odc_n_epns':
      return (item['epn_enabled'] && item['epn_enabled'] == 'true') ? item['odc_n_epns'] : 'OFF';
    default:
      return JSON.stringify(item);
  }
}

/**
  * Create a map of tasks grouped by their FLP name
  * @param {object} tasks - raw data
  * @return {JSON} {<string>:{list: <array>, stdout: <string>}}
  */
const getTasksByFlp = (tasks) => {
  var taskMap = {};
  tasks.forEach((task) => {
    const hostname = task.deploymentInfo?.hostname ?? 'Unknown';
    if (!taskMap.hasOwnProperty(hostname)) {
      taskMap[hostname] = {list: [], stdout: ''};
    }
    task.name = getTaskShortName(task.name);
    taskMap[hostname].list.push(task);
    taskMap[hostname].stdout = task.sandboxStdout;
  });
  return taskMap;
}

/**
  * Create a map of tasks grouped by their EPN host
  * @param {object} tasks - raw data
  * @return {JSON} {<string>:{list: <array>, stdout: <string>}}
  */
const getTasksByEpn = (tasks) => {
  var taskMap = {};
  tasks.forEach((task) => {
    const hostname = task.host;
    if (!taskMap.hasOwnProperty(hostname)) {
      taskMap[hostname] = {list: []};
    }
    taskMap[hostname].list.push(task);
  });
  return taskMap;
}

/**
 * Method to check if a task name is the long version.
 * If yes, return the short version
 * @param {string} taskName
 * @return {string}
 */
const getTaskShortName = (taskName) => {
  const regex = new RegExp(`tasks/.*@`);
  const matchedTaskName = taskName.match(regex);
  if (matchedTaskName) {
    taskName = matchedTaskName[0].replace('tasks/', '').replace('@', '');
  }
  return taskName;
}

/**
 * Look through the AliECS Integrated services and return the status and style associated to it of ODC for a given environment
 * ODC status should be displayed as `-` if EPN is set to OFF
 * @param {string} envId 
 * @param {Model} model
 * @param {JSON} userVars - payload from AliECS with variables set by the user
 * @returns {vnode}
 */
const parseOdcStatusPerEnv = (environment) => {
  try {
    if (environment?.hardware?.epn?.info) {
      const {state} = environment.hardware.epn.info;
      const styleClass = ODC_STATE_COLOR[state] ?? '';
      return {state, styleClass};
    }
  } catch (error) {
    console.error(error);
  }
  return {state: '-', styleClass: ''};
}

/**
 * Helpers
 */

/**
 * Given a JSON containing userVars, it will apply the logic described in OCTRL-574
 * to display desired value for topology
 * @param {JSON} item
 * @returns {String}
 */
const _parseTopology = (item) => {
  if (!item['epn_enabled'] || item['epn_enabled'] === 'false') {
    return '-';
  }
  if (item['odc_topology'] && item['epn_enabled'] === 'true' && item['pdp_config_option'] === 'Manual XML') {
    const pathList = item['odc_topology'].split('/');
    if (pathList.length > 0) {
      return `xml, ${pathList[pathList.length - 1]}`;
    } else {
      return 'xml, -';
    }
  }
  if (item['epn_enabled'] === 'true' && item['pdp_config_option'] === 'Repository hash') {
    return `hash, ${item['pdp_o2_data_processing_hash']}, ` +
      `${item['pdp_topology_description_library_file']}, ${item['pdp_workflow_name']}`;
  }
  if (item['epn_enabled'] === 'true' && item['pdp_config_option'] === 'Repository path') {
    return `path, ${item['pdp_o2_data_processing_path']}, ` +
      `${item['pdp_topology_description_library_file']}, ${item['pdp_workflow_name']}`;
  }
  return '-';
}
export {getTasksByFlp, getTasksByEpn, parseObject, getTaskShortName, parseOdcStatusPerEnv};
