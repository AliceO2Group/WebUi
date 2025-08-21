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

import {h, iconChevronBottom, iconChevronTop, RemoteData} from '/js/src/index.js';
import pageLoading from '../../common/pageLoading.js';
import errorPage from '../../common/errorPage.js';
import {detectorHeader} from '../../common/detectorHeader.js';
import {iconCircleX, iconCircleCheck} from '/js/src/icons.js';
import {ROLES} from '../../workflow/constants.js';
import {isUserAllowedRole} from '../../common/userRole.js';
import {tasksPerHostPanel} from '../../common/task/tasksPerHostPanel.js';
import { HardwareComponent } from '../../common/enums/HardwareComponent.js';
import { cleanupResourcesButton } from './components/cleanupResourcesButton.js';
import { cleanupTasksButton } from './components/cleanupTasksButton.js';
/**
 * @file Content of the TaskList Page that displays list of tasks grouped by their host and detector and allows 
 * cleaning operations via ECS deployments or gRPC requests
 */

/**
 * Header of the page with its title
 * @return {vnode}
 */
export const TaskListHeader = () => [
  h('.w-100.text-center', [
    h('h4', 'Task list')
  ]),
];

/**
 * Content of the page with main components
 * @param {Object} model
 * @return {vnode}
 */
export const TaskListContent = (model) => [
  detectorHeader(model),
  h('.text-center.scroll-y.absolute-fill', {style: 'top: 40px'}, [
    infoPanel(model.taskPageModel),
    getListOfTasks(model, model.taskPageModel)
  ])
];

/**
 * Panel in which response messages from stream operations such as
 * `clean resources` will be displayed
 * @param {TaskPageModel} taskPageModel
 * @return {vnode}
 */
const infoPanel = (taskPageModel) =>
  taskPageModel.cleanUpResourcesRequest.match({
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
const showContent = (model, items) => {
  const isAdmin = model.detectors.selected === 'GLOBAL' && isUserAllowedRole(ROLES.Admin, true);
  const isDetectorAndHostListLoaded = model.detectors.hostsByDetectorRemote.isSuccess();
  const cleanResourcesCallback = () => model.taskPageModel.cleanUpResources();
  const cleanupTasksCallback = () => model.taskPageModel.cleanUpTasks();
  return h('.text-left.ph2', [
    h('.w-100.flex-row.pv2.items-center', [
      isAdmin && h('.w-100.flex-row.flex-end.pv2.g2', [
        cleanupResourcesButton(model.taskPageModel.cleanUpTasksRequest, isDetectorAndHostListLoaded, cleanResourcesCallback),
        cleanupTasksButton(model.taskPageModel.cleanUpTasksRequest, cleanupTasksCallback)
      ]),
    ]),
    h('.w-100', detectorPanels(model, items))
  ]);
};

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
      isUserAllowedRole(ROLES.Guest, true)))
    .map((detector) => h('.w-100', [
      h('.panel-title.flex-row.p2', [
        h('h4.w-20', detector),
        h('.w-80.text-right', toggleDetectorPanel(model, detectors[detector])),
      ]),
      detectors[detector].isOpened && h('.panel', [
        tasksTables(model.task.taskTableModel, detectors[detector].list.payload)
      ])
    ]))
];

/**
 * A panel displaying information or actions for a detector panel
 * @param {Object} model 
 * @param {JSON} tasks 
 */
const toggleDetectorPanel = (model, taskPanel) =>
  !model.taskPageModel.areTasksInDetector(taskPanel.list.payload) ?
    h('label', 'No tasks')
    : h('button.btn', {
      onclick: () => {
        taskPanel.isOpened = !taskPanel.isOpened;
        model.taskPageModel.notify();
      }
    }, taskPanel.isOpened ? iconChevronTop() : iconChevronBottom());

/**
 * Display all known task grouped by hosts
 * @param {TaskTableModel} taskTableModel - task table model
 * @param {Map<String, JSON>} tasksByHost - tasks grouped by host
 * @return {vnode} - table with tasks details
 */
const tasksTables = (taskTableModel, tasksByHost) => {
  return Object.keys(tasksByHost)
    .filter((hostname) => tasksByHost[hostname] && tasksByHost[hostname].list && tasksByHost[hostname].stdout)
    .map((hostname) => tasksPerHostPanel(
      { taskTableModel },
      { tasks: RemoteData.success(tasksByHost[hostname].list) },
      HardwareComponent.FLP)
    );
};
