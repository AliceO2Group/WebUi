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
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX, iconList, iconClipboard
} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import showTableItem from '../common/showTableItem.js';
import {controlEnvironmentPanel} from './components/controlEnvironmentPanel.js';
import {parseObject, getTasksByFlp} from './../common/utils.js';
import {userVarsRow, defaultsRow, varsRow} from './components/expandableEnvRows.js';
import {infoLoggerButton, bookkeepingButton, qcgButton, mesosLogButton} from './components/buttons.js';
import {ROLES} from './../workflow/constants.js';

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
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (data) => showContent(model, data.environment),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Show all properties of environment and buttons for its actions at bottom
 * @param {Object} model
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showContent = (model, item) => [
  (model.isAllowed(ROLES.Admin) || item.includedDetectors.every(detector => model.lock.isLockedByMe(detector))) &&
  controlEnvironmentPanel(model.environment, item),
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
      h(`.w-50`, showEnvDetailsTable(model, item)),
      h('.w-50.text-center.flex-column', [
        item.state === 'RUNNING' && ((COG && COG.GRAFANA && COG.GRAFANA.status) ?
          readoutDataPanel(COG.GRAFANA.plots, '&var-run=' + item.currentRunNumber) :
          h('.w-100.text-center.grafana-font',
            'Grafana plots were not loaded, please contact an administrator'
          )),
        redirectGUIsPanel(item),
      ])
    ]),
    h('',
      h('table.table', [
        h('tbody', [
          userVarsRow(item.userVars, model.environment),
          defaultsRow(item.defaults, model.environment),
          varsRow(item.vars, model.environment),
        ])
      ])
    ),
  ]),
  h('.m2', [
    h('h4', 'Tasks by FLP'),
    h('.w-100', tasksPerFlpTables(model.environment, item))
  ]),
];

/**
 *  Build a panel containing buttons which will redirect the user to other GUIs based on 
 * environment information:
 * @param {Object} item - environment information
 */
const redirectGUIsPanel = (item) => {
  return h('.w-100.text.center.flex-row', {
    style: 'padding-top: var(--space-xl);margin-left: var(--space-s);'
  }, [
    h('.w-33.flex-row.justify-center', h('.w-70', infoLoggerButton(item))),
    h('.w-33.flex-row.justify-center', h('.w-70', bookkeepingButton())),
    h('.w-33.flex-row.justify-center', h('.w-70', qcgButton())),
  ]);
};

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
        src: data[0] + runParam,
        style: 'height: 100%; border: 0'
      }),
      h('iframe.w-50', {
        src: data[1] + runParam,
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
    h('iframe.w-100', {
      src: data[2] + runParam,
      style: 'height: 10em; border: 0;'
    }),
  ]);

/**
 * Table to display Environment details
 * @param {Object} item - object to be shown
 * @return {vnode} table view
 */
const showEnvDetailsTable = (model, item) => {
  const width = '.w-30';
  return h('table.table', [
    h('tbody', [
      item.state === 'RUNNING' && h(`tr`, [
        h(`th${width}`,
          h('.w-100.flex-row', [
            h('.w-70', 'Run Number'),
            model.isContextSecure() && copyValueToClipboardButton(model, item.currentRunNumber)
          ])
        ),
        h('td', [
          h('.badge.bg-success.white', {
            style: 'font-size:35px'
          }, item.currentRunNumber),
        ]
        )
      ]),
      h('tr', [
        h(`th${width}`,
          h('.w-100.flex-row', [
            h('.w-70', 'ID'),
            model.isContextSecure() && copyValueToClipboardButton(model, item.id)
          ])),
        h('td', item.id)
      ]),
      h('tr', [
        h(`th${width}`, 'Created'),
        h('td', parseObject(item.createdWhen, 'createdWhen'))
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
    ])
  ]);
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
          ['Name', 'Locked', 'Status', 'State', 'Host Name', 'More']
            .map((header) => h('th', header))
        ])
      ),
      h('tbody', [
        tasks.map((task) => [h('tr', [
          h('td.w-40', task.name),
          h('td.w-10',
            h('.flex-row.items-center.justify-center.w-33', task.locked ? iconLockLocked() : iconLockUnlocked())
          ),
          h('td.w-10', task.status),
          h('td.w-10', {
            class: (task.state === 'RUNNING' ? 'success' :
              (task.state === 'CONFIGURED' ? 'warning' :
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

/**
 * Copy current location to the user's clipboard
 * @param {Object} model
 * @return {vnode}
 */
const copyValueToClipboardButton = (model, value) =>
  h('.w-30.text-right',
    h('button.btn.btn-sm', {
      title: 'Copy value to clipboard',
      onclick: () => {
        navigator.clipboard.writeText(value);
        model.notification.show('Successfully copied to clipboard', 'success', 1500);
      }
    }, iconClipboard())
  );
