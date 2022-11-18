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
import errorPage from '../common/errorPage.js';
import {detectorHeader} from '../common/detectorHeader.js';
import {iconLockLocked, iconLockUnlocked, iconCloudDownload, iconCircleX, iconCircleCheck} from '/js/src/icons.js';
import {ROLES} from './../workflow/constants.js';

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
  h('.text-center.scroll-y.absolute-fill', {style: 'top: 40px'}, [
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
    Success: (data) => showContent(model, data),
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
const showContent = (model, items) =>
  h('.text-left.ph2', [
    h('.w-100.flex-column.items-end.pv2', searchTasks(model)),
    h('.w-100', detectorPanels(model, items))
  ]);

/**
 * Adds a search bar for the user to filter tasks by name
 * @param {Object} model 
 * @returns 
 */
const searchTasks = (model) =>
  h('.w-20',
    h('input.form-control', {
      id: 'searchTasksInput',
      placeholder: 'Search tasks by name',
      oninput: (e) => model.task.filterBy = e.target.value
    })
  );

/**
 * Build a list of panels per detector with hosts and their respective tasks
 * @param {Object} model
 * @param {Map<String, JSON} detectors
 * @returns {vnode}
 */
const detectorPanels = (model, detectors) => [
  Object.keys(detectors)
    .filter((detector) => (
      detector === model.detectors.selected ||
      model.detectors.selected === 'GLOBAL' ||
      model.isAllowed(ROLES.Guest, true)))
    .map((detector) => h('.w-100', [
      h('.panel-title.flex-row.p2', [
        h('h4.w-20', detector),
        h('.w-80.text-right', toggleDetectorPanel(model, detectors[detector])),
      ]),
      detectors[detector].isOpened && h('.panel', [
        tasksTables(model, detectors[detector].list.payload)
      ])
    ]))
];

/**
 * A panel displaying information or actions for a detector panel
 * @param {Object} model 
 * @param {JSON} tasks 
 */
const toggleDetectorPanel = (model, taskPanel) =>
  !model.task.areTasksInDetector(taskPanel.list.payload) ?
    h('label', 'No tasks')
    : h('button.btn', {
      onclick: () => {
        taskPanel.isOpened = !taskPanel.isOpened;
        model.task.notify();
      }
    }, taskPanel.isOpened ? iconChevronTop() : iconChevronBottom());

/**
 * Display all running task grouped by hosts
 * @param {Object} model
 * @param {Map<String, JSON>} tasks
 * @returns {vnode}
 */
const tasksTables = (model, tasksByHost) =>
  Object.keys(tasksByHost)
    .filter((hostname) => tasksByHost[hostname] && tasksByHost[hostname].list && tasksByHost[hostname].stdout)
    .map((hostname) => [
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
                  href: tasksByHost[hostname].stdout,
                  target: '_blank'
                }, h('button.btn-sm.primary', iconCloudDownload())
                )
              )
            ),
            h('tr', ['Name', 'PID', 'State', 'Locked'].map((header) => h('th', header)))
          ),
          h('tbody', tasksByHost[hostname].list
            .filter((task) => model.task.filterBy.test(task.name))
            .map((task) => [
              h('tr', [
                h('td.w-50', task.name),
                h('td.w-10', task.pid),
                h('td.w-10', {
                  class: (task.state === 'RUNNING' ? 'success'
                    : (task.state === 'CONFIGURED' ? 'warning'
                      : ((task.state === 'ERROR' || task.state === 'UNKNOWN') ? 'danger' : ''))),
                  style: 'font-weight: bold;'
                }, task.state),
                h('td.w-10', task.locked ? iconLockLocked('fill-orange') : iconLockUnlocked('fill-green'))
              ])
            ])
          )
        ])
      ])
    ]);
