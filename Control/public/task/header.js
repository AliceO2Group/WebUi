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

/**
 * @file Header of the Task Page that displays the title and 2 clean operations
 */

/**
 * Header
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50.text-center', [
    h('h4', 'Task list')
  ]),
  h('.flex-row.text-right', [
    cleanResourcesButton(model.task),
    cleanTasksButton(model.task)
  ])
];

/**
 * Prepares cleanup tasks button in top right corner
 */
const cleanTasksButton = (task) =>
  h('.flex-column.dropdown#flp_selection_info_icon', {style: 'display: flex'}, [
    h(`button.btn.btn-danger.mh1`, {
      class: task.cleanUpTasksRequest.isLoading() ? 'loading' : '',
      disabled: task.cleanUpTasksRequest.isLoading(),
      onclick: () => confirm(`Are you sure you know what you are doing?`)
        && task.cleanUpTasks(),
    }, 'Clean tasks'),
    h('.p2.dropdown-menu-right#flp_selection_info.text-center', {style: 'width: 350px'},
      'Shutdowns or kills any task that is unlocked and not part of an active environment')
  ]);

/**
 * Prepares cleanup resources button in top right corner
 */
const cleanResourcesButton = (task) =>
  h('.flex-column.dropdown#flp_selection_info_icon', {style: 'display: flex'}, [
    h(`button.btn.btn-warning.mh1`, {
      class: task.cleanUpTasksRequest.isLoading() ? 'loading' : '',
      disabled: task.cleanUpTasksRequest.isLoading(),
      onclick: () => task.cleanUpResources(),
    }, 'Clean resources'),
    h('.p2.dropdown-menu-right#flp_selection_info.text-center', {style: 'width: 500px'}, [
      h('', `It runs 'roc-cleanup' and 'fairmq-shmmonitor -c' to clean RAM and disk resources, including SHM files.`),
      h('', `It does nothing to tasks.`)
    ])
  ]);
