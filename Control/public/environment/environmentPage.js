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
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX, iconList, iconCloudDownload
} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import showTableItem from '../common/showTableItem.js';
import {controlEnvironmentPanel} from './components/controlEnvironmentPanel.js';
import {getTasksByFlp} from './../common/utils.js';
import {userVarsRow, defaultsRow, varsRow} from './components/expandableEnvRows.js';

/**
 * @file Page to show 1 environment (content and header)
 */

/**
 * Header of page showing one environment
 * Only page title with no action
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
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
    Loading: () => pageLoading(),
    Success: (data) => showContent(model.environment, data.environment),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Show all properties of environment and buttons for its actions at bottom
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showContent = (environment, item) => [
  controlEnvironmentPanel(environment, item),
  item.state === 'RUNNING' &&
  h('.m2.flex-row', {style: 'height: 10em;'}, [
    (COG && COG.GRAFANA && COG.GRAFANA.status) ?
      graphsPanel(COG.GRAFANA.plots, '&var-run=' + item.currentRunNumber) :
      h('.w-100.text-center.grafana-font',
        'Grafana plots were not loaded, please contact an administrator'
      ),
  ]),
  h('.m2', [
    h('.flex-row', [
      h(`${item.state === 'RUNNING' ? '.w-50' : '.w-100'}`, showEnvDetailsTable(item, environment)),
      item.state === 'RUNNING' && h('.w-50.text-center.flex-column',
        (COG && COG.GRAFANA && COG.GRAFANA.status) ?
          readoutDataPanel(COG.GRAFANA.plots, '&var-run=' + item.currentRunNumber) :
          h('.w-100.text-center.grafana-font',
            'Grafana plots were not loaded, please contact an administrator'
          ),
      )
    ]),
    h('',
      h('table.table', [
        h('tbody', [
          userVarsRow(item.userVars, environment),
          defaultsRow(item.defaults, environment),
          varsRow(item.vars, environment),
        ])
      ])
    ),
  ]),
  h('.m2', [
    h('h4', 'Tasks by FLP'),
    h('.w-100', tasksPerFlpTables(environment, item))
  ]),
];

/**
 * Build multiple tables of the tasks frouped by FLP
 * @param {Environment} environmentModel
 * @param {JSON} environment - GetEnvironment response.environment
 * @return {vnode}
 */
const tasksPerFlpTables = (environmentModel, environment) => {
  const tasksByFlp = getTasksByFlp(environment.tasks);
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
 * Method to display plots from Grafana
 * @param {Array<String>} data
 * @return {vnode}
 */
const graphsPanel = (data, runParam) =>
  h('.flex-column.w-100', [
    h('.flex-row.w-100', [
      h('iframe.w-50', {
        src: data[3] + runParam,
        style: 'height: 100%; border: 0'
      }),
      h('iframe.w-50', {
        src: data[2] + runParam,
        style: 'height: 100%; border: 0'
      }),
    ]),
  ]);

/**
 * Builds a panel with 2 data plots from Grafana about Readout data rate
 * @param {Array<String>} data
 * @param {Strig} runParam
 * @returns 
 */
const readoutDataPanel = (data, runParam) =>
  h('.flex-row.w-100', [
    h('iframe.w-50', {
      src: data[1] + runParam,
      style: 'height: 10em; border: 0;'
    }),
    h('iframe.w-50', {
      src: data[0] + runParam,
      style: 'height: 10em; border: 0;'
    }),
  ]);

/**
 * Table to display Environment details
 * @param {Object} item - object to be shown
 * @param {Environment} environment
 * @return {vnode} table view
 */
const showEnvDetailsTable = (item, environment) => {
  const width = item.state === 'RUNNING' ? '.w-30' : '.w-15';
  return h('table.table', [
    h('tbody', [
      item.state === 'RUNNING' && h('tr', [
        h(`th${width}`, 'Run Number'),
        h('td',
          h('.badge.bg-success.white', {
            style: 'font-size:35px'
          }, item.currentRunNumber)
        )
      ]),
      h('tr', [
        h(`th${width}`, 'ID'),
        h('td', item.id)
      ]),
      h('tr', [
        h(`th${width}`, 'Created'),
        h('td', new Date(item.createdWhen).toLocaleString())
      ]),
      h('tr', [
        h(`th${width}`, 'State'),
        h('td',
          {
            class: item.state === 'RUNNING' ?
              'success' :
              (item.state === 'CONFIGURED' ? 'warning' : (item.state === 'ERROR' ? 'danger' : '')),
            style: 'font-weight: bold;'
          },
          item.state)
      ]),
      h('tr', [
        h(`th${width}`, 'Root Role'),
        h('td', item.rootRole)
      ]),
      h('tr', [
        h(`th${width}`, 'Number of Tasks'),
        h('td', item.tasks.length)
      ]),
      h('tr', [
        h(`th${width}`, 'FLP count'),
        h('td', item.numberOfFlps)
      ]),
      h('tr', [
        h(`th${width}`, 'Detectors'),
        item.includedDetectors && item.includedDetectors.length > 0 ?
          h('td', [item.includedDetectors.map((detector) => `${detector} `)])
          : h('td', '-')
      ]),
      h('tr', [
        h(`th${width}`, 'InfoLogger'),
        h('td', infoLoggerButton(environment, item))
      ]),
    ])
  ]);
};

/**
 * Open InfoLogger in a new browser tab with run number set if available
 * @param {Object} environment
 * @return {vnode}
 */
const infoLoggerButton = (environment, item) =>
  h('a.ph2', {
    style: {display: !COG.ILG_URL ? 'none' : ''},
    title: 'Open InfoLogger',
    href: item.currentRunNumber ?
      `//${COG.ILG_URL}?q={"run":{"match":"${item.currentRunNumber}"}}`
      : `//${COG.ILG_URL}`,
    target: '_blank'
  }, h('button.btn.primary', iconList()));

/**
 * Button to allow the user to download a file with logs from Messos
 * @param {string} href - location of the mesos log
 * @return {vnode}
 */
const mesosLogButton = (href) =>
  h('a', {
    style: {display: !href ? 'none' : ''},
    title: 'Download Mesos Environment Logs',
    href: href,
    target: '_blank'
  }, h('button.btn-sm.primary', iconCloudDownload())
  );

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
      `//${COG.ILG_URL}?q={"run":{"match":"${environment.currentRunNumber}"},"hostname":{"match":"${host}"}}`
      : `//${COG.ILG_URL}?q={"hostname":{"match":"flptest1"}}`,
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
          ['Name', 'Locked', 'Status', 'State', 'Host Name', 'More']
            .map((header) => h('th', header))
        ])
      ),
      h('tbody', [
        tasks.map((task) => [h('tr', [
          h('td', task.name),
          h('td', h('.flex-row.items-center.justify-center.w-33', task.locked ? iconLockLocked() : iconLockUnlocked())),
          h('td', task.status),
          h('td', {
            class: (task.state === 'RUNNING' ? 'success' :
              (task.state === 'CONFIGURED' ? 'warning' :
                ((task.state === 'ERROR' || task.state === 'UNKNOWN') ? 'danger' : ''))),
            style: 'font-weight: bold;'
          }, task.state),
          h('td', task.deploymentInfo.hostname),
          h('td',
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
