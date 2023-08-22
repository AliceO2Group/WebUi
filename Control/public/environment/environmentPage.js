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

/* global COG */

import {
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX, iconList
} from '/js/src/index.js';
import {environmentPanel} from './components/environmentPanel.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import showTableItem from '../common/showTableItem.js';
import {getTasksByFlp, getTasksByEpn} from './../common/utils.js';
import {userVarsRow, defaultsRow, varsRow} from './components/expandableEnvRows.js';
import {mesosLogButton} from './components/buttons.js';
import {ALIECS_STATE_COLOR} from '../common/constants/stateColors.js';
import {currentPageAndParameters} from './../utilities/currentPageAndParameters.js';

/**
 * @file Page to show 1 environment (content and header)
 */

/**
 * Header of page showing one environment
 * Only page title with no action
 * @return {vnode}
 */
export const header = () => [
  h('.w-50 text-center', [
    h('h4', 'Environment details')
  ]),
  h('.flex-grow text-right', [])
];

/**
 * Content page showing one environment
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.environment.item.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (data) => showContent(model, data),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Show all properties of environment and buttons for its actions at bottom
 * @param {Object} model
 * @param {EnvironmentDetails} item - environment to show on this page
 * @return {vnode}
 */
const showContent = (model, item) => {
  const {hardware: {flp, qc, epn, trg}} = item;
  const panels = {
    configuration: {
      name: 'Configuration',
      content: configurationTabPanel,
    },
    epn: {
      name: `EPNs (${epn?.tasks?.total ?? '?'})`,
      content: tasksPerEpnTables,
    },
    flp: {
      name: `FLPs (${flp?.tasks?.total ?? '?'})`,
      content: tasksPerFlpTables,
    },
    qc: {
      name: `QC  (${qc?.tasks?.total ?? '?'})`,
      content: tasksPerFlpTables,
    },
    trg: {
      name: `TRG  (${trg?.tasks?.total ?? '?'})`,
      content: tasksPerFlpTables,
    },
  };
  const {parameters} = currentPageAndParameters();

  return [
    h('.m2', environmentPanel(model, item, false)),
    h('ul.nav.nav-tabs', [
      Object.entries(panels).map(([id, {name}]) => {
        const isActive = parameters.panel === id;
        return h('li.nav-item',
          {
            id: `${id}-task-source`,
          }, h(`a.nav-link${isActive ? '.active' : ''}`, {
            onclick: () => {
              if (!isActive) {
                model.router.go(`?page=environment&id=${item.id}&panel=${id}`, true, true);
                model.environment.getEnvironment({id: item.id}, false, id);
                model.environment.notify();
              }
            }
          }, name)
        );
      }),
    ]),
    h('.tab-content.m2', Object.entries(panels)
      .map(([id, {content}]) => {
        const isActive = parameters.panel === id;
        if (isActive) {
          return h(`.tab-pane${isActive ? '.active' : ''}`, {id: `${id}-pane`}, content(model.environment, item))
        }
      })
    ),
  ];
};

/**
 * Display configuration variables
 * @returns {vnode}
 */
const configurationTabPanel = (envModel, item) =>
  h('.m2', [
    h('table.table', [
      h('tbody', [
        userVarsRow(item.userVars, envModel),
        defaultsRow(item.defaults, envModel),
        varsRow(item.vars, envModel),
      ])
    ])
  ]);

/**
 * Build multiple tables of the tasks grouped by FLP
 * @param {Environment} environmentModel
 * @param {JSON} environment - GetEnvironment response.environment
 * @return {vnode}
 */
const tasksPerFlpTables = (environmentModel, environment) => {
  const {tasks = []} = environment;
  if (tasks.length === 0) {
    return h('.text-center.w-100', 'Environment is in transition');
  }
  const tasksByFlp = getTasksByFlp(tasks);
  return [Object.keys(tasksByFlp).map((host) =>
    h('', [
      h('.p2.flex-row.bg-primary.white', [
        h('h5.w-100', host),
        h('.flex-row', [
          infoLoggerPerFlpButton(environment, environmentModel, host),
          mesosLogButton(tasksByFlp[host].stdout)
        ]),
      ]),
      showEnvTasksTable(environmentModel, tasksByFlp[host].list)
    ])
  )];
};

/**
 * Build multiple tables of the tasks grouped by FLP
 * @param {JSON} environment - GetEnvironment response.environment
 * @return {vnode}
 */
const tasksPerEpnTables = (envModel, environment) => {
  const {tasks = []} = environment;
  const tasksByHosts = getTasksByEpn(tasks);
  return [
    Object.keys(tasksByHosts).map((host) =>
      h('', [
        h('.p2.flex-row.bg-primary.white', [
          h('h5.w-100', host),
        ]),
        h('table.table.table-sm', {style: 'margin-bottom: 0'}, [
          h('thead',
            h('tr', [
              ['ID', 'Path', 'Ignored', 'State'].map((header) => h('th', header))
            ])
          ),
          h('tbody', [
            tasks.map((task) => {
              if (task.host === host) {
                return h('tr', [
                  h('td.w-30', task.taskId),
                  h('td.w-50', task.path),
                  h('td.w-10', task.ignored + ''),
                  h('td.w-10', {
                    class: ALIECS_STATE_COLOR[task.state],
                    style: 'font-weight: bold;'
                  }, task.state),
                ]);
              }
            }),
          ])
        ])
      ])
    )];
};

/**
 * Button to open InfoLogger with run and hostname pre-set
 * @param {string} href - location of the mesos log
 * @return {vnode}
 */
const infoLoggerPerFlpButton = (environment, model, host) =>
  h('a', {
    style: {display: !(COG || COG.ILG_URL) ? 'none' : ''},
    title: 'Open InfoLogger for this hostname',
    href: environment.currentRunNumber ?
      `${COG.ILG_URL}?q={"run":{"match":"${environment.currentRunNumber}"},"hostname":{"match":"${host}"}}`
      : `${COG.ILG_URL}?q={"hostname":{"match":"${host}"}}`,
    target: '_blank'
  }, h('button.btn-sm.primary', iconList())
  );

/**
 * Method to create and display a table with tasks details
 * @param {Object} environment
 * @param {Array<Object>} tasks
 * @return {vnode}
 */
const showEnvTasksTable = (environment, tasks) => {
  return h('.scroll-auto.panel', [
    h('table.table.table-sm', {style: 'margin-bottom: 0'}, [
      h('thead',
        h('tr', [
          ['Name', 'PID', 'Locked', 'Status', 'State', 'Host Name', 'More']
            .map((header) => h('th', header))
        ])
      ),
      h('tbody', [
        tasks.map((task) => [h('tr', [
          h('td.w-30', task.name),
          h('td.w-10', task.pid),
          h('td.w-10',
            h('.flex-row.items-center.justify-center.w-33', task.locked ? iconLockLocked() : iconLockUnlocked())
          ),
          h('td.w-10', task.status),
          h('td.w-10', {
            class: (task.state === 'RUNNING' ? 'success' :
              (task.state === 'CONFIGURED' ? 'primary' :
                ((task.state === 'ERROR' || task.state === 'UNKNOWN') ? 'danger' : ''))),
            style: 'font-weight: bold;'
          }, task.state),
          h('td.w-20', task.deploymentInfo.hostname),
          h('td.w-10',
            h('button.btn-sm.btn-default', {
              title: 'More Details',
              onclick: () => environment.task.toggleTaskView(task.taskId),
            }, environment.task.openedTasks[task.taskId] ? iconChevronTop() : iconChevronBottom())
          ),
        ]),
        environment.task.openedTasks[task.taskId] && environment.task.list[task.taskId] &&
        addTaskDetailsTable(environment, task),
        ]),
      ])
    ])
  ]);
};

/**
 *  Method to display an expandable table with details about a selected task if request was successful
 *  Otherwise display loading or error message
 * @param {Object} environment
 * @param {JSON} task
 * @return {vnode}
 */
const addTaskDetailsTable = (environment, task) => h('tr', environment.task.list[task.taskId].match({
  NotAsked: () => null,
  Loading: () => h('td.shadow-level3.m5', {style: 'font-size: 0.25em; text-align: center;', colspan: 7}, pageLoading()),
  Success: (data) => h('td', {colspan: 7}, showTableItem(data)),
  Failure: (_error) => h('td.shadow-level3.m5',
    {style: 'text-align: center;', colspan: 7, title: 'Could not load arguments'},
    [iconCircleX(), ' ', _error]),
}));
