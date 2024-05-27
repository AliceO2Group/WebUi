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

import {EPN_TASK_STATES, getTaskStateClassAssociation} from './../../common/enums/TaskState.js';
import {h} from '/js/src/index.js';

/**
 * Build a table with the summary of the tasks states for the environment grouped by component (FLP, EPN, QC, CTP Readout) and detector
 * @param {EnvironmentInfo} environment
 * @return {vnode} - component with an HTML table
 */
export const environmentEpnTasksSummaryTable = (environment) => {
  const {hardware} = environment;
  return h('table.table-ecs.table-ecs-sm.shadow-level1', [
    h('thead', [
      hardwareComponentsTableHeaderRow(hardware),
    ]),
    h('tbody', [
      EPN_TASK_STATES.map((state) => rowForTaskSate(state, hardware)),
    ])
  ]);
};

/**
 * Build the HTML header row of the table with the components present as hardware in the environment
 * @param {Object<['flp', 'qc', 'epn', 'trg'], Object>} hardware - object with the hardware components and details
 * @return {vnode} - component with an HTML table row
 */
const hardwareComponentsTableHeaderRow = (hardware) => h('tr', [
  h('th', 'EPN States'),
  h('th.break-space-cell.text-center', `#hosts:${hardware?.epn?.hosts ?? '-'}`)
]);

/**
 * Build a row of the table with the summary of the tasks for specified state for the environment
 * @param {String} state - task state
 * @param {Object<['flp', 'qc', 'epn', 'trg'], Object>} hardware - object with the hardware components and details
 * @return {vnode} - component with an HTML table row
 */
const rowForTaskSate = (state, hardware) => {
  const taskClass = getTaskStateClassAssociation(state);
  console.log(state, taskClass)
  return h('tr', [
    h(`td${taskClass}`, state), h(`td.text-center${taskClass}`, hardware?.epn?.tasks?.states[state] ?? '-'),
  ]);
};
