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

import { h, RemoteData } from '/js/src/index.js';
import { cleanupResourcesButton } from './components/buttons/cleanupResourcesButton.js';
import { cleanupTasksButton } from './components/buttons/cleanupTasksButton.js';
import { detectorHeader } from '../../common/detectorHeader.js';
import { environmentEventsPanel } from '../../common/events/environmentEventsPanel.js';
import { HardwareComponent } from '../../common/enums/HardwareComponent.js';
import { isUserAllowedRole } from '../../common/userRole.js';
import { ROLES } from '../../workflow/constants.js';
import { tasksPerHostPanel } from '../../common/task/tasksPerHostPanel.js';
import {toggleDetectorPanelVisibilityButton} from './components/buttons/toggleDetectorPanelVisibilityButton.js';
import errorPage from '../../common/errorPage.js';
import pageLoading from '../../common/pageLoading.js';

const GLOBAL_VIEW = 'GLOBAL';

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
 * Content of the task list page with main components
 * @param {Model} model - the root model of the application
 * @return {vnode}
 */
export const TaskListContent = (model) => {
  const { services: { detectors }, taskPageModel, environment: {list} } = model;

  let resourcesCleanupEvents = [];
  if (list.isSuccess()) {
    const currentActiveEnvironments = list.payload.environments;
    const resourcesCleanupEnvironments = currentActiveEnvironments.filter(({rootRole}) => rootRole === 'resources-cleanup');
    if (resourcesCleanupEnvironments.length > 0) {
      resourcesCleanupEvents = resourcesCleanupEnvironments[resourcesCleanupEnvironments.length - 1].events;
    }
  }

  const { selected: currentDetectorView, hostsByDetectorRemote } = detectors;
  const isAdmin = currentDetectorView === GLOBAL_VIEW && isUserAllowedRole(ROLES.Admin, true);
  const isDetectorAndHostListLoaded = hostsByDetectorRemote.isSuccess();

  const { cleanUpRequest } = taskPageModel;
  const cleanUpTasksCallback = taskPageModel.cleanUpTasks.bind(taskPageModel);
  const cleanUpResourcesCallback = taskPageModel.cleanUpResources.bind(taskPageModel);
  return [
    detectorHeader(model),
    h('.scroll-y.absolute-fill.flex-column.p1.g1', { style: 'top: 40px' }, [
      isAdmin &&
      h('.flex-row.w-100', [
        cleanUpRequest.match({
          NotAsked: () => null,
          Loading: () => null,
          Success: (message) => h('.flex-row.justify-center.items-center.success', { style: 'flex: 1' }, message),
          Failure: (error) => h('.flex-row.justify-center.items-center.danger', { style: 'flex: 1' }, error),
        }),
        h('.flex-row.right-align.g1', [
          // Cleanup operations are ran across all detectors, thus user needs to be in global view  and be an admin
          cleanupResourcesButton(cleanUpRequest, isDetectorAndHostListLoaded, cleanUpResourcesCallback),
          cleanupTasksButton(cleanUpRequest, cleanUpTasksCallback)
        ]),
      ]),
      resourcesCleanupEvents.length > 0 && h('', [
        h('h5', 'Resources Cleanup Events (last attempt)'),
        environmentEventsPanel(resourcesCleanupEvents),
      ]),
      taskPageModel.detectorPanels.match({
        NotAsked: () => null,
        Loading: () => pageLoading(),
        Success: (detectorPanelsPayload) => showTaskPanelGroupedByDetector(detectorPanelsPayload, taskPageModel, currentDetectorView),
        Failure: (error) => errorPage(error),
      })
    ])
  ];
};

/**
 * Creates a panel for with all eligible detectors as per the detector view which allows the user to show/hide the tasks 
 * that are active as reported by ECS on that detector
 * @param {Map<String, {list: Map<string, object>, isOpened: boolean}>} detectorPanels - the detector panels data and display configuration
 * @param {TaskPageModel} taskPageModel - the task page model
 * @param {String} currentDetectorView - the currently selected detector view (either an individual detector or GLOBAL)
 * @returns {vnode}
 */
const showTaskPanelGroupedByDetector = (detectorPanels, taskPageModel, currentDetectorView) => {
  return h('.w-100.g1.flex-column', [
    Object.keys(detectorPanels)
      .filter((detectorAcronym) => currentDetectorView === GLOBAL_VIEW || detectorAcronym === currentDetectorView)
      .map((detectorAcronym) => detectorPanelsNode(detectorAcronym, detectorPanels[detectorAcronym], taskPageModel))
  ]);
};

/**
 * Build a list of panels per detector with hosts and their respective tasks
 * @param {string} detectorAcronym - the detector acronym (TST, ITS, etc.)
 * @param {{list: Map<string, object>, isOpened: boolean}} detectorPanel - the detector panel data and display configuration
 * @param {TaskPageModel} taskPageModel - the task page model
 * @returns {vnode}
 */
const detectorPanelsNode = (detectorAcronym, detectorPanel, taskPageModel) => {
  const toggleVisibilityButtonCallback = () => {
    detectorPanel.isOpened = !detectorPanel.isOpened;
    taskPageModel.notify();
  };
  return h('', [
    h('.panel-title.flex-row.p2', [
      h('h4.w-20.text-left', detectorAcronym),
      h('.w-80.text-right', toggleDetectorPanelVisibilityButton(detectorPanel, toggleVisibilityButtonCallback)),
    ]),
    detectorPanel.isOpened && h('.panel.p1', [
      tasksTables(taskPageModel.taskTableModel, detectorPanel.list.payload)
    ])
  ]);
};

/**
 * Display all known task grouped by hosts as long as the host group contains a list and stdout attribute
 * @param {TaskTableModel} taskTableModel - task table model
 * @param {Map<String, JSON>} tasksByHost - tasks grouped by host
 * @return {vnode} - table with tasks details
 */
const tasksTables = (taskTableModel, tasksByHost) => {
  return Object.keys(tasksByHost)
    .filter((hostname) => tasksByHost[hostname]?.list && tasksByHost[hostname]?.stdout)
    .map((hostname) => tasksPerHostPanel(
      { taskTableModel },
      { tasks: RemoteData.success(tasksByHost[hostname].list) },
      HardwareComponent.FLP)
    );
};
