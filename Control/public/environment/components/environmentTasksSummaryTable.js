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

import {HARDWARE_COMPONENTS_WITHOUT_EPN, HardwareComponent} from '../../common/enums/HardwareComponent.js';
import {FLP_TASK_STATES, getTaskStateClassAssociation} from './../../common/enums/TaskState.js';
import {h} from '/js/src/index.js';

/**
 * Build a table with the summary of the tasks states for the environment grouped by component (FLP, EPN, QC, CTP Readout) and detector
 * @param {EnvironmentInfo} environment
 * @return {vnode} - component with an HTML table
 */
export const environmentTasksSummaryTable = (environment) => {
  const {hardware} = environment;
  return h('table.table-ecs.table-ecs-sm.shadow-level1', [
    h('thead', [
      hardwareComponentsTableHeaderRow(hardware),
      detectorsTableHeaderRow(hardware),
    ]),
    h('tbody', [
      FLP_TASK_STATES.map((state) => rowForTaskSate(state, hardware)),
    ])
  ]);
};

/**
 * Build the HTML header row of the table with the components present as hardware in the environment
 * @param {Object<['flp', 'qc', 'epn', 'trg'], Object>} hardware - object with the hardware components and details
 * @return {vnode} - component with an HTML table row
 */
const hardwareComponentsTableHeaderRow = (hardware) => h('tr', [
  h('th', 'Tasks Summary'),
  HARDWARE_COMPONENTS_WITHOUT_EPN
    .filter(component => component !== 'EPN')
    .map((component) => {
      const componentInLowerCase = component.toLocaleLowerCase();
      const colspan = hardware[componentInLowerCase]?.detectorCounters
        ? Object.keys(hardware[componentInLowerCase].detectorCounters).length
        : 1;
      return h('th.break-space-cell.text-center', {
        colspan,
      }, `${HardwareComponent[component]} \n#hosts:${hardware[componentInLowerCase].hosts}`)
    }),
]);

/**
 * Build the HTML header row of the table with the detectors present in the environment
 * @param {Object<String, Object>} detectorCounters - object with the detectors counters of tasks
 * @return {vnode} - component with an HTML table row
 */
const detectorsTableHeaderRow = ({flp: {detectorCounters = {}} = {}}) => h('tr', [
  h('th', 'States'),
  Object.keys(detectorCounters).map((detector) => h('th.text-center', detector)),
  h('th.text-center', {colspan: HARDWARE_COMPONENTS_WITHOUT_EPN.length - 1}, ''), // empty cell to align with the rest of the table
]);

/**
 * Build a row of the table with the summary of the tasks for specified state for the environment
 * @param {String} state - task state
 * @param {Object<['flp', 'qc', 'epn', 'trg'], Object>} hardware - object with the hardware components and details
 * @return {vnode} - component with an HTML table row
 */
const rowForTaskSate = (state, hardware) => {
  const taskClass = getTaskStateClassAssociation(state);
  return h('tr', [
    h(`td${taskClass}`, state),
    HARDWARE_COMPONENTS_WITHOUT_EPN
      .map((component) => {
        const componentInLowerCase = component.toLocaleLowerCase();
        if (componentInLowerCase === 'flp') {
          const {flp: {detectorCounters}} = hardware;
          return Object.keys(detectorCounters)
            .map((detector) =>
              h(`td.text-center${taskClass}`, detectorCounters[detector].states[state] || '-')
            );
        } else {
          return h(`td.text-center${taskClass}`, hardware[componentInLowerCase].tasks.states[state] ?? '-');
        }
      })
  ]);
};
