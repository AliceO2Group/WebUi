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
import {rowForCard} from '../card/rowForCard.js';
import {ALIECS_STATE_COLOR} from '../constants/stateColors.js';

/**
 * Given a list of tasks, build a panel which will display counters of different states and statuses
 * @param {Array<TaskInfo>} tasks - list of tasks to be parsed
 * @returns {vnode}
 */
export const taskCounterContent = (tasks) => {
  const states = {};
  const statuses = {};
  tasks.map((task) => ({state: task.state, status: task.status}))
    .forEach(({state, status}) => {
      states[state] = (states[state] + 1) || 1;
      statuses[status] = (statuses[status] + 1) || 1;
    });
  const totalTasks = tasks.length;
  return [
    h('.w-100.justify-between', [
      h('h5', 'Tasks by state: '),
      h('.flex-column.ph2.w-100', [
        Object.entries(states)
          .map(([key, value]) => {
            return rowForCard(key, `${value}/${totalTasks}`, {
              keyClasses: [ALIECS_STATE_COLOR[key.toLocaleUpperCase()]],
              valueClasses: [ALIECS_STATE_COLOR[key.toLocaleUpperCase()]],
            })
          })
      ]),
    ]),
    h('.w-100.justify-between', [
      h('h5', 'Tasks by status: '),
      h('.flex-column.ph2.w-100', [
        Object.entries(statuses)
          .map(([key, value]) => rowForCard(key, `${value}/${totalTasks}`))
      ]),
    ]),
  ]
};
