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

/* global COG */

import {
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX
} from '/js/src/index.js';
import { getTasksByFlp } from './../utils.js';
import { infoLoggerButtonLink } from './../buttons/infoLoggerRedirectButton.js';
import { redirectButtonLink } from './../buttons/redirectButtonLink.js';
import pageLoading from './../pageLoading.js';
import showTableItem from './../showTableItem.js';
import { getTaskStateClassAssociation } from './../enums/TaskState.js';

/**
 * Build multiple tables of the tasks grouped by FLP
 * @param {EnvironmentModel} environmentModel - environment model from which to extract what is needed
 * @param {TaskModel} environmentModel.task - task model
 * @param {EnvironmentInfo} environmentInfo - environment information DTO object
 * @return {vnode}
 */
export const tasksPerFlpTable = ({ task: taskModel }, environmentInfo) => {
  const {tasks = [], currentTransition = '', currentRunNumber: run} = environmentInfo;
  if (tasks.length === 0 && !currentTransition) {
    return h('.text-center.w-100', 'No tasks found');
  }
  const tasksByFlp = getTasksByFlp(tasks);
  return [
    Object.keys(tasksByFlp).map((hostname) =>
      h('', [
        h('.p2.flex-row.bg-primary.white', [
          h('h5.flex-grow-3', hostname),
          h('.flex-row.flex-grow-1.g2', [
            infoLoggerButtonLink({ run, hostname }, 'InfoLogger FLP', COG.ILG_URL),
            redirectButtonLink(tasksByFlp[hostname].stdout, 'Mesos', 'Download Mesos logs', true),
          ]),
        ]),
        showTasksTable(taskModel, tasksByFlp[hostname].list)
      ])
    ),
  ];
};

/**
 * Method to create and display a table with tasks details
 * @param {taskModel} taskModel - task model
 * @param {Array<object>} tasks - list of tasks that is to be displayed
 * @return {vnode} - table with tasks details
 */
const showTasksTable = (taskModel, tasks) => {
  return h('.scroll-auto.panel', [
    h('table.table.table-sm', {style: 'margin-bottom: 0'}, [
      h('thead',
        h('tr', [
          ['Name', 'PID', 'Locked', 'Status', 'State', 'Host Name', 'More']
            .map((header) => h('th', header))
        ])
      ),
      h('tbody', [
        tasks.map((task) => [h('tr', [
          h('td.w-30', task.name),
          h('td.w-10', task.pid),
          h('td.w-10',
            h('.flex-row.items-center.justify-center.w-33', task.locked ? iconLockLocked() : iconLockUnlocked())
          ),
          h('td.w-10', task.status),
          h(`td.w-10${getTaskStateClassAssociation(task.state)}`, task.state),
          h('td.w-20', task.deploymentInfo.hostname),
          h('td.w-10',
            h('button.btn-sm.btn-default', {
              title: 'More Details',
              onclick: () => taskModel.toggleTaskView(task.taskId),
            }, taskModel.openedTasks[task.taskId] ? iconChevronTop() : iconChevronBottom())
          ),
        ]),
        taskModel.openedTasks[task.taskId] && taskModel.list[task.taskId]
        && showTaskDetailsTable(taskModel.list[task.taskId]),
        ]),
      ])
    ])
  ]);
};

/**
 *  Method to display a vertical column based table with in-depth task details
 *  If request to fetch task details is not successful, display loading or error message
 * @param {RemoteData} taskRemoteData - remote data object with task details
 * @return {vnode} - table with task details
 */
const showTaskDetailsTable = (taskRemoteData) => h('tr',
  taskRemoteData.match({
    NotAsked: () => null,
    Loading: () => h('td.shadow-level3.m5', {
      style: 'font-size: 0.25em; text-align: center;', colspan: 7
    }, pageLoading()),
    Success: (data) => h('td', {colspan: 7}, showTableItem(data)),
    Failure: (_error) => h('td.shadow-level3.m5',
      {style: 'text-align: center;', colspan: 7, title: 'Could not load arguments'},
      [iconCircleX(), ' ', _error]),
  })
);
