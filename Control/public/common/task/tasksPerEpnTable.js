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
import { infoLoggerButtonLink } from '../buttons/infoLoggerRedirectButton.js';
import {getTasksByEpn} from '../../../common/utils.js';
import { getTaskStateClassAssociation } from '../enums/TaskState.js';

/* global COG */

/**
 * For each unique host (EPN) within the tasks list, create a table with EPN task details
 * @param {PartialEnvironmentInfo} environmentInfo - environmentInfo information DTO object
 * @param {Array<Task>} [environmentInfo.tasks = []] - list of tasks to build table for
 * @param {string} [environmentInfo.currentTransition = undefined] - current transition if any
 * @param {number} [environmentInfo.currentRunNumber] - current run number
 * @return {vnode}
 */
export const tasksPerEpnTable = ({ taskTableModel }, {tasks = [], currentTransition = undefined, currentRunNumber: run}) => {
  const tableColumns = ['ID', 'Path', 'Ignored', 'State'];
  const tasksByHosts = getTasksByEpn(tasks);
  if (tasks.length === 0 && !currentTransition) {
    return h('.text-center.w-100', 'No tasks found');
  }

  return [
    Object.keys(tasksByHosts)
      .map((hostname) =>
        h('', [
          h('.p2.flex-row.bg-primary.white', [
            h('h5.flex-grow-3', hostname),
            h('.flex-row.flex-grow-1', [
              infoLoggerButtonLink({ run, hostname }, 'InfoLogger EPN', COG.ILG_EPN_URL),
            ]),
          ]),
          h('table.table.table-sm', {style: 'margin-bottom: 0'}, [
            h('thead',
              h('tr', [
               tableColumns.map((header) => h('th', header))
              ])
            ),
            h('tbody', [
              (tasksByHosts[hostname].list ?? []).map((task) => 
                h('tr', [
                  h('td.w-30', task.taskId),
                  h('td.w-50', task.path),
                  h('td.w-10', task.ignored + ''),
                  h(`td.w-10${getTaskStateClassAssociation(task.state)}`, task.state),
                ])
              ),
            ])
          ])
      ])
    )];
};
