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

import {dcsProperty} from '../../../common/dcs/dcsPropertiesRow.js';
import {HARDWARE_COMPONENTS, HardwareComponent} from '../../../common/enums/HardwareComponent.js';
import {TASK_STATES, getTaskStateClassAssociation} from '../../../common/enums/TaskState.js';
import {h} from '/js/src/index.js';

/**
 * Build a table with the summary of the tasks states for the environment grouped by component (FLP, EPN, QC, CTP Readout) and detector
 * @param {EnvironmentInfo} environment
 * @param {Object<String, {pfrAvailability, sorAvailability}} detectorsAvailability - object with the availability of the detectors
 * @param {function} onRowClick - function to be called when a row is clicked
 * @return {vnode} - component with an HTML table
 */
export const environmentTasksSummaryTable = (environment, detectorsAvailability, onRowClick) => {
  const {state, hardware, userVars, currentTransition = undefined} = environment;
  const isDcsEnabled = userVars?.dcs_enabled === 'true';
  const shouldDisplaySorAvailability = isDcsEnabled && state === 'CONFIGURED' && !currentTransition;
  
  return h('table.table-ecs.table-ecs-sm.shadow-level1', [
    h('thead', [
      hardwareComponentsTableHeaderRow(hardware),
      detectorsTableHeaderRow(hardware, detectorsAvailability, shouldDisplaySorAvailability)
    ]),
    h('tbody', [
      TASK_STATES.map((state) => rowForTaskSate(state, hardware, onRowClick)),
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
  HARDWARE_COMPONENTS
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
 * @param {Object<String, {pfrAvailability, sorAvailability}} availability - object with the availability of the detectors
 * @param {Boolean} shouldDisplaySorAvailability - flag to display the SOR availability
 * @return {vnode} - component with an HTML table row
 */
const detectorsTableHeaderRow = ({flp: {detectorCounters = {}} = {}}, availability, shouldDisplaySorAvailability) =>
  h('tr', [
    h('th', 'States'),
    Object.keys(detectorCounters).map((detector) => h('th.text-center', [
      detector,
      shouldDisplaySorAvailability && h('.f6', dcsProperty(availability[detector].sorAvailability, 'SOR'))
    ])),
    h('th.text-center', {colspan: HARDWARE_COMPONENTS.length - 1}, ''), // empty cell to align with the rest of the table
  ]);

/**
 * Build a row of the table with the summary of the tasks for specified state for the environment
 * @param {String} state - task state
 * @param {object<component: HardwareComponent, object>} hardware - object with the hardware components and details
 * @param {function} onRowClick - function to be called when a row is clicked
 * @return {vnode} - component with an HTML table row
 */
const rowForTaskSate = (state, hardware, onRowClick) => {
  const taskClass = getTaskStateClassAssociation(state);
  return h('tr', [
    h(`td${taskClass}`, state),
    HARDWARE_COMPONENTS
      .map((component) => {
        const componentInLowerCase = component.toLocaleLowerCase();
        if (component.toLocaleUpperCase() === HardwareComponent.FLP) {
          const {flp: {detectorCounters}} = hardware;
          return Object.keys(detectorCounters)
            .map((detector) =>
              h(`td.text-center${taskClass}.actionable-icon`, {
                onclick: () => onRowClick && onRowClick(componentInLowerCase, state),
              }, detectorCounters[detector].states[state] || '-')
            );
        } else {
          return h(`td.text-center${taskClass}.actionable-icon`, {
            onclick: () => onRowClick && onRowClick(componentInLowerCase, state),
          }, hardware[componentInLowerCase].tasks.states[state] ?? '-');
        }
      })
  ]);
};
