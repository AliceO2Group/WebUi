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

import {h, iconChevronBottom, iconChevronTop} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import loading from '../common/loading.js';
import errorPage from '../common/errorPage.js';
import errorComponent from '../common/errorComponent.js';
import {detectorHeader} from '../common/detectorHeader.js';
import {iconLockLocked, iconLockUnlocked, iconCloudDownload, iconCircleX, iconCircleCheck} from '/js/src/icons.js';

/**
 * @file Content of the Task Page that displays list of tasks grouped by their host and detector
 */

/**
 * Content
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => [
  detectorHeader(model),
  h('.text-center', {style: 'top: 40px'}, [
    infoPanel(model),
    getListOfTasks(model, model.task)
  ])
];

/**
 * Panel in which response messages from stream operations such as
 * `clean resources` will be displayed
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
 * @param {Object} model
 * @param {Object} tasks
 * @return {vnode}
 */
const getListOfTasks = (model, task) =>
  task.detectorPanels.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data, task),
    Failure: (error) => errorPage(error),
  })

/**
 * Create tables with tasks for each FLP and on content refresh
 * navigate to the same position as before
 * @param {Object} model 
 * @param {Map<String, JSON>} items 
 * @param {Task} task 
 * @returns {vnode}
 */
const showContent = (model, items, task) => (items && Object.keys(items).length > 0)
  ? h('.scroll-y.absolute-fill.text-left.p2', {
    style: 'top:40px',
    oncreate: (vnode) => vnode.dom.scrollTop = task.scrollTop,
    onremove: (vnode) => task.scrollTop = vnode.dom.scrollTop,
  }, h('.w-100', detectorPanels(model, items)))
  : h('h3.m4', ['No tasks were found']);

/**
 * Build a list of panels per detector with hosts and their respective tasks
 * @param {Object} model
 * @param {Map<String, JSON} detectors
 * @returns {vnode}
 */
const detectorPanels = (model, detectors) => [
  Object.keys(detectors).map((detector) => h('.w-100', [
    h('.panel-title.flex-row.p2', [
      h('h4.w-20', detector),
      h('.w-80.text-right', toggleDetectorPanel(model, detectors[detector])),
    ]),
    detectors[detector].isOpened && h('.panel', [
      tasksByHostPanel(model, detectors[detector].list)
    ])
  ]))
];

/**
 * A panel displaying information or actions for a detector panel
 * @param {Object} model 
 * @param {JSON} tasks 
 */
const toggleDetectorPanel = (model, taskPanel) =>
  taskPanel.list.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-right', loading(1.2)),
    Success: (data) => (Object.keys(data).length === 0) ? h('label', 'No tasks')
      : h('button.btn', {
        onclick: () => {
          taskPanel.isOpened = !taskPanel.isOpened;
          model.task.notify();
        }
      }, taskPanel.isOpened ? iconChevronTop() : iconChevronBottom()),
    Failure: (error) => h('.w-100.text-right', errorComponent(error)),
  });

/**
 * Display all running task as table
 * @param {Object} model 
 * @param {RemoteData} tasks 
 * @returns {vnode} 
*/
const tasksByHostPanel = (model, tasks) =>
  tasks.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (data) => Object.keys(data).length > 0 && tasksTables(model, data),
    Failure: () => null,
  });

/**
 * 
 * @param {Object} model
 * @param {Map<String, JSON>} tasks
 * @returns {vnode}
 */
const tasksTables = (model, tasks) =>
  Object.keys(tasks).length === 0 ?
    h('.w-100.text-center', 'No tasks found for this detector')
    :
    Object.keys(tasks).map((hostname) => [
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
                  href: tasks[hostname].stdout,
                  target: '_blank'
                }, h('button.btn-sm.primary', iconCloudDownload())
                )
              )
            ),
            h('tr', ['Name', 'PID', 'State', 'Locked'].map((header) => h('th', header)))
          ),
          h('tbody', tasks[hostname].list.map((task) => [h('tr', [
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
