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

import {
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX
} from '/js/src/index.js';
import pageLoading from '../pageLoading.js';
import showTableItem from '../showTableItem.js';
import { getTaskStateClassAssociation } from '../enums/TaskState.js';

/**
 * For a given list of FLP tasks, build a table with tasks details and buttons to allow for retrieving more details per task
 * @param {Array<Task>} [tasks = []] - list of tasks to build table for
 * @param {TaskTableModel} taskTableModel - task table model to use for features such as filtering and retrieving more details of task
 * @return {vnode} - table of the FLP tasks
 */
export const flpTasksTable = (tasks, taskTableModel) => {
  const tableColumns = ['Name', 'PID', 'Locked', 'Status', 'State', 'Host Name', 'More'];

  return h('.scroll-auto.panel', [
    h('table.table.table-sm', {style: 'margin-bottom: 0'}, [
      h('thead',
        h('tr', [
          tableColumns.map((header) => h('th', header)),
        ])
      ),
      h('tbody', [
        tasks.map((task) => [
          h('tr', [
            h('td.w-30', task.name),
            h('td.w-10', task.pid),
            h('td.w-10',
              h('.flex-row.items-center.justify-center.w-33', task.locked ? iconLockLocked() : iconLockUnlocked())
            ),
            h('td.w-10', task.status),
            h(`td.w-10${getTaskStateClassAssociation(task.state)}`, task.state),
            h('td.w-20', task?.deploymentInfo?.hostname),
            h('td.w-10',
              h('button.btn-sm.btn-default', {
                title: 'More Details',
                onclick: () => taskTableModel.toggleTaskView(task.taskId),
              }, taskTableModel.openedTaskViews[task.taskId] ? iconChevronTop() : iconChevronBottom())
            ),
          ]),
          taskTableModel.openedTaskViews[task.taskId] && taskTableModel.tasksAsRemoteDataById[task.taskId]
          && showTaskDetailsTable(taskTableModel.tasksAsRemoteDataById[task.taskId]),
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
