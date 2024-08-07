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

import {h} from '/js/src/index.js';
import { epnTasksTable } from './epnTasksTable.js';
import { flpTasksTable } from './flpTasksTable.js';
import { getTasksByEpn } from '../../../common/utils.js';
import { getTasksByFlp } from '../utils.js';
import { HardwareComponent } from '../enums/HardwareComponent.js';
import { infoLoggerButtonLink } from '../buttons/infoLoggerRedirectButton.js';
import { redirectButtonLink } from '../buttons/redirectButtonLink.js';
import pageLoading from '../pageLoading.js';
import { getTaskStateClassAssociation, TASK_STATES } from '../enums/TaskState.js';
const { FLP, EPN } = HardwareComponent;

/* global COG */

/**
 * Given an environment, extract the tasks and group them by their respective hardware (EPN/FLP/QC/TRG) component
 * @param {object} models - object with potential models to extract the tasks from
 * @param {TaskTableModel} models.taskTableModel - task table model to use for features such as filtering
 * @param {PartialEnvironmentInfo} environmentInfo - object from which to extract tasks data
 * @param {RemoteData<Task[]>} [environmentInfo.tasks] - list of tasks to build table for
 * @param {string} [environmentInfo.currentTransition] - current transition if any
 * @param {number} [environmentInfo.currentRunNumber] - current run number
 * @param {string} source - source of the tasks (FLP/EPN/QC/TRG) as defined in @see environmentNavigationTabs.js
 * @return {vnode} multiple tables of the tasks grouped by their hardware component
 */
export const tasksPerHostPanel = (
  { taskTableModel },
  { tasks = [], currentTransition = undefined, currentRunNumber: run, id: partition },
  source
) => {
  source = (source.toLocaleUpperCase() === EPN) ? EPN : FLP;

  if (tasks.isLoading()) {
    return h('.m5.text-center', {
      style: 'min-height: 25em;',
    }, pageLoading(2));
  } else if (tasks.isFailure()) {
    return h('.m5.text-center', 'Failed to load tasks');
  }
  tasks = tasks.payload;
  tasks = tasks.filter(taskTableModel.doesTaskMatchFilter.bind(taskTableModel));
  const tasksByHosts = source === FLP ? getTasksByFlp(tasks) : getTasksByEpn(tasks);
  
  const infoLoggerButtonTitle = source === FLP ? 'InfoLogger FLP' : 'InfoLogger EPN';
  const infoLoggerButtonUrl = source === FLP ? COG.ILG_URL : COG.ILG_EPN_URL;

  return h('.flex-column.g2', [
    h('.flex-row.g1', [
      h('.flex-row.g1', [
        h('h4', 'Filter by:'),
        h('.flex-row.flex-grow-1',
          h('input.form-control', {
            style: 'width: unset;',
            placeholder: 'name/path',
            id: 'taskNameFilter',
            oninput: (e) => taskTableModel.setFilterByName(e.target.value),
          })
        ),
        h('.flex-row.g1.flex-wrap.flex-grow-3', [
          TASK_STATES.map((state) =>
            h(`button.btn${getTaskStateClassAssociation(state)}`, {
              onclick: () => taskTableModel.toggleFilterState(state),
              class: taskTableModel.isFilterStateEnabled(state) ? 'active' : '',
            }, state)
          ),
        ]),
      ]),
    ]),
    tasks.length === 0 && !currentTransition 
      ? h('.text-center.w-100', 'No tasks found')
      : Object.keys(tasksByHosts)
        .map((hostname) => {
          let hostnameToIlg = hostname;
          if (source === EPN) {
            [hostnameToIlg] = hostname.split('.');
          }
          return h('', [
            h('.p2.flex-row.bg-primary.white', [
              h('h5.flex-grow-3', hostname),
              h('.flex-row.flex-grow-1.g2', [
                infoLoggerButtonLink({ run, hostname: hostnameToIlg, partition }, infoLoggerButtonTitle, infoLoggerButtonUrl),
                source === FLP && redirectButtonLink(tasksByHosts[hostname].stdout, 'Mesos', 'Download Mesos logs', true),
              ]),
            ]),
            source === FLP
              ? flpTasksTable(tasksByHosts[hostname].list, taskTableModel)
              : epnTasksTable(tasksByHosts[hostname].list),
          ]);
        })
  ]);
};
