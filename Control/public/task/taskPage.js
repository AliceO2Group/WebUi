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
import {iconLockLocked, iconLockUnlocked, iconCloudDownload, iconCircleX, iconCircleCheck} from '/js/src/icons.js';

/**
 * @file Page that displays list of tasks
 */

/**
 * Header
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', [
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
  h(`button.btn.btn-danger.mh1`, {
    class: task.cleanUpTasksRequest.isLoading() ? 'loading' : '',
    disabled: task.cleanUpTasksRequest.isLoading(),
    onclick: () => confirm(`Are you sure you know what you are doing?`)
      && task.cleanUpTasks(),
    title: 'Clean tasks'
  }, 'Clean tasks');

/**
 * Prepares cleanup resources button in top right corner
 */
const cleanResourcesButton = (task) =>
  h(`button.btn.btn-warning.mh1`, {
    class: task.cleanUpTasksRequest.isLoading() ? 'loading' : '',
    disabled: task.cleanUpTasksRequest.isLoading(),
    onclick: () => task.cleanUpResources(),
    title: 'Clean Resources'
  }, 'Clean resources');


/**
 * Content
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.text-center', [
  infoPanel(model),
  getListOfTasks(model.task)
]);

/**
 * Panel in which response messages from stream will be displayed
 * @param {Object} model
 * @return {vnode}
 */
const infoPanel = (model) =>
  model.task.cleanUpResourcesRequest.match({
    NotAsked: () => null,
    Loading: () => h('.m2.f6.p2.shadow-level1.text-left.flex-row', [
      h('.p2.text-center', pageLoading(1.5)),
      h('.p2', 'Request to clean resources has been sent'),
    ]),
    Success: (data) => h('.m2.f6.p2.shadow-level1.text-left.flex-row', {
      class: data.ended ? (data.success ? 'success' : 'danger') : '',
    }, [
      !data.ended ?
        h('.pv1', pageLoading(1.5))
        : (data.success ? h('.pv2.ph4.text-center', iconCircleCheck()) : h('.pv2.ph4.text-center', iconCircleX())),
      h('.w-100.p2', data.info.message),
    ]),
    Failure: (error) => h('.m2.f6.p2.shadow-level1.text-left.flex-row.danger', [
      h('.pv2.ph4', iconCircleX()),
      h('.p2', error),
    ]),
  })

/**
 * Call GetTasks on server side
 * @param {Object} tasks
 * @return {vnode}
 */
const getListOfTasks = (task) =>
  task.tasksByFlp.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(data, task),
    Failure: (error) => errorPage(error),
  })

/**
 * Render table of display message
 */
const showContent = (items, task) => (items && Object.keys(items).length > 0)
  ? h('.p2.absolute-fill.scroll-y', {
    oncreate: (vnode) => vnode.dom.scrollTop = task.scrollTop,
    onremove: (vnode) => task.scrollTop = vnode.dom.scrollTop,
  }, taskTable(items))
  : h('h3.m4', ['No tasks found.']);

/**
 * Display all running task as table
 * param {object} items - formatted list of tasks
 */
const taskTable = (items) =>
  Object.keys(items).map((hostname) => [
    h('.shadow-level1', [
      h('table.table', {
        style: 'white-space: pre-wrap;'
      }, [
        h('thead',
          h('tr.table-primary',
            h('th', {colspan: 3}, hostname),
            h('th.flex-row', {style: {'justify-content': 'flex-end'}, colspan: 1},
              h('a', {
                title: 'Download Mesos Environment Logs',
                href: items[hostname].stdout,
                target: '_blank'
              }, h('button.btn-sm.primary', iconCloudDownload())
              )
            )
          ),
          h('tr', ['Name', 'PID', 'State', 'Locked'].map((header) => h('th', header)))
        ),
        h('tbody', items[hostname].list.map((task) => [h('tr', [
          h('td.w-50', task.name),
          h('td.w-10', task.pid),
          h('td.w-10', {
            class: (task.state === 'RUNNING' ? 'success'
              : (task.state === 'CONFIGURED' ? 'warning'
                : ((task.state === 'ERROR' || task.state === 'UNKNOWN') ? 'danger' : ''))),
            style: 'font-weight: bold;'
          }, task.state),
          h('td.w-10', task.locked ? iconLockLocked('fill-orange') : iconLockUnlocked('fill-green'))
        ])]))
      ])
    ])
  ]);
