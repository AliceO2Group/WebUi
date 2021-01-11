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
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';

/**
 * @file Page to FrameworkInfo(About) (content and header)
 */

/**
 * Header of the about page
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'Task list')),
  h('.flex-grow text-right', [])
];

/**
 * Content of the status page (or frameworkinfo)
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.flex-column', [
  createTableForControlGUIInfo(model.task),
]);

/**
 * Show COG and its dependencies info based on request status
 * @param {Object} tasks
 * @return {vnode}
 */
const createTableForControlGUIInfo = (task) =>
  h('.p2', [
    task.getTaskList.match({
      NotAsked: () => null,
      Loading: () => pageLoading(),
      Success: (data) => showContent(data),
      Failure: (error) => errorPage(error),
    }),
  ]);

/**
 * Display all running task
 * param {object} items - formatted list of tasks
 */
const showContent = (items) =>
  Object.keys(items).map((hostname) => [
    h('.shadow-level1', [
      h('table.table', {
        style: 'white-space: pre-wrap;'
      }, [
        h('thead',
          h('tr.table-primary',
            h('th', {colspan: 2}, hostname)
          ),
          h('tr', ['Name', 'PID'].map((header) => h('th', header)))
        ),
        h('tbody', items[hostname].map((task) => [h('tr', [
          h('td', task.name.substr(task.name.lastIndexOf("/") + 1)),
          h('td', task.pid)
        ])]))
      ])
    ])
  ]);
