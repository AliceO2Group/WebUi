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

import {
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX, iconList, iconCloudDownload
} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import showTableItem from '../common/showTableItem.js';
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
  h('.flex-grow text-right', [

  ])
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
  showControl(environment, item),
  item.state === 'RUNNING' &&
  h('.m2.flex-row',
    {
      style: 'height: 10em;'
    },
    [
      h('.grafana-font.m1.flex-column',
        {
          style: 'width: 15%;'
        },
        [
          h('', {style: 'height:40%'}, 'Run Number'),
          h('',
            h('.badge.bg-success.white',
              {style: 'font-size:45px'},
              item.currentRunNumber)
          )
        ]
      ),
      environment.plots.match({
        NotAsked: () => h('.w-100.text-center.grafana-font', 'Grafana plots were not loaded, please refresh the page'),
        Loading: () => null,
        Success: (data) => showEmbeddedGraphs(data),
        Failure: () => h('.w-100.text-center.grafana-font',
          'Grafana plots were not loaded, please contact an administrator'
        ),
      })
    ]
  ),
  showEnvDetailsTable(item, environment),
  h('.m2', [
    h('h4', 'Tasks'),
    h('.flex-row.flex-grow',
      h('.flex-grow',
        showEnvTasksTable(environment, item.tasks)
      )
    ),
  ]),
];

/**
 * Method to display plots from Grafana
 * @param {Array<String>} data
 * @return {vnode}
 */
const showEmbeddedGraphs = (data) =>
  [
    h('.flex-row',
      {style: 'width:30%;'},
      [
        h('iframe.w-50',
          {
            src: data[0],
            style: 'height: 100%; border: 0;'
          }
        ),
        h('iframe.w-50',
          {
            src: data[1],
            style: 'height: 100%; border: 0;'
          }
        )
      ]),
    // Large Plot
    h('iframe.flex-grow',
      {
        src: data[2],
        style: 'height: 100%; border: 0'
      }
    )
  ];

/**
 * Table to display Environment details
 * @param {Object} item - object to be shown
 * @param {Environment} environment
 * @return {vnode} table view
 */
const showEnvDetailsTable = (item, environment) =>
  h('.m2.mv4.shadow-level1',
    h('table.table', [
      h('tbody', [
        h('tr', [
          h('th.w-15', 'Number of Tasks'),
          h('td', item.tasks.length)
        ]),
        h('tr', [
          h('th.w-15', 'ID'),
          h('td', item.id)
        ]),
        h('tr', [
          h('th.w-15', 'Created'),
          h('td', new Date(item.createdWhen).toLocaleString())
        ]),
        h('tr', [
          h('th.w-15', 'State'),
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
          h('th.w-15', 'Root Role'),
          h('td', item.rootRole)
        ]),
        h('tr', [
          h('th.w-15',
            h('.flex-row', [
              h('.w-75', 'User Vars'),
              h('.w-25.text-right.mh2.actionable-icon', {
                onclick: () => {
                  environment.expandUserVars = !environment.expandUserVars;
                  environment.notify();
                }
              }, environment.expandUserVars ? iconChevronTop() : iconChevronBottom()
              )]
            )
          ),
          h('td.flex-row', !environment.expandUserVars ?
            h('.mh2.overflow', JSON.stringify(item.userVars))
            :
            h('.flex-column', [
              Object.keys(item.userVars).map((key) =>
                h('.mh2.flex-row', [
                  h('', {style: 'font-weight: bold'}, key + ':'),
                  h('', {
                    style: 'word-break: break-word'
                  }, JSON.stringify(item.userVars[key]))
                ])
              ),
            ]),
          )
        ])
      ])
    ])
  );

/**
 * List of buttons, each one is an action to do on the current environment `item`
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showControl = (environment, item) => h('.mv2.pv3.ph2', [
  h('.flex-row', [
    h('.w-75',
      [
        controlButton('.btn-success', environment, item, 'START', 'START_ACTIVITY', 'CONFIGURED'), ' ',
        controlButton('.btn-danger', environment, item, 'STOP', 'STOP_ACTIVITY', 'RUNNING'), ' ',
        controlButton('.btn-warning', environment, item, 'CONFIGURE', 'CONFIGURE', 'STANDBY'), ' ',
        controlButton('', environment, item, 'RESET', 'RESET', 'CONFIGURED'), ' '
      ]
    ),
    h('.w-25', {
      style: 'display: flex; justify-content: flex-end;'
    }, [
      messosLogButton(environment),
      infoLoggerButton(environment, item),
      destroyEnvButton(environment, item),
      destroyEnvButton(environment, item, true)
    ])
  ]),
  environment.itemControl.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (_data) => null,
    Failure: (error) => h('p.danger', error),
  })
]);

/**
 * Makes a button to toggle severity
 * @param {string} buttonType
 * @param {Object} environment
 * @param {Object} item
 * @param {string} label - button's label
 * @param {string} type - action
 * @param {string} stateToHide - state in which button should not be displayed
 * @return {vnode}
 */
const controlButton = (buttonType, environment, item, label, type, stateToHide) =>
  h(`button.btn${buttonType}`,
    {
      class: environment.itemControl.isLoading() ? 'loading' : '',
      disabled: environment.itemControl.isLoading(),
      style: item.state !== stateToHide ? 'display: none;' : '',
      onclick: () => {
        environment.controlEnvironment({id: item.id, type: type});
      },
      title: item.state !== stateToHide ? `'${label}' cannot be used in state '${item.state}'` : label
    },
    label
  );

/**
 * Create a button which will call the ShutDown&DestroyEnv GRPC Method
 * @param {Object} environment
 * @param {JSON} item
 * @param {bool} forceDestroy
 * @return {vnode}
 */
const destroyEnvButton = (environment, item, forceDestroy = false) =>
  h(`button.btn.btn-danger`, {
    class: environment.itemControl.isLoading() ? 'loading' : '',
    disabled: environment.itemControl.isLoading(),
    style: {display: !forceDestroy ? 'none' : ''},
    onclick: () => confirm(`Are you sure you want to to shutdown this ${item.state} environment?`)
      && environment.destroyEnvironment({id: item.id, allowInRunningState: true, force: forceDestroy}),
    title: forceDestroy ? 'Force the shutdown of the environment' : 'Shutdown environment'
  }, forceDestroy ? 'Force Shutdown' : 'Shutdown');

/**
 * Open InfoLogger in a new browser tab with run number set if available
 * @param {Object} environment
 * @return {vnode}
 */
const infoLoggerButton = (environment, item) =>
  h('a.ph2', {
    style: {display: !environment.infoLoggerUrl ? 'none' : ''},
    title: 'Open InfoLogger',
    href: item.currentRunNumber ?
      `//${environment.infoLoggerUrl}?q={"run":{"match":"${item.currentRunNumber}"}}`
      : `//${environment.infoLoggerUrl}`,
    target: '_blank'
  }, h('button.btn.primary', iconList()));


/**
 * Download a file with logs from Messos
 * @param {JSON} environment 
 * @return {vnode}
 */
const messosLogButton = (environment) =>
  h('a', {
    style: {display: !environment.item.payload.mesosStdout ? 'none' : ''},
    title: 'Download Mesos Environment Logs',
    href: environment.item.payload.mesosStdout,
    target: '_blank'
  }, h('button.btn.primary', iconCloudDownload())
  );

/**
 * Method to create and display a table with tasks details
 * @param {Object} environment
 * @param {Array<Object>} tasks
 * @return {vnode}
 */
const showEnvTasksTable = (environment, tasks) => h('.scroll-auto.shadow-level1', [
  h('table.table.table-sm', {style: 'margin:0'}, [
    h('thead',
      h('tr',
        [
          ['Name', 'Locked', 'Status', 'State', 'Host Name', 'More']
            .map((header) => h('th', header))
        ]
      )
    ),
    h('tbody', [
      tasks.map((task) => [h('tr', [
        h('td', task.name),
        h('td', h('.flex-row.items-center.justify-center.w-33', task.locked ? iconLockLocked() : iconLockUnlocked())),
        h('td', task.status),
        h('td', {
          class: (task.state === 'RUNNING' ?
            'success' : (task.state === 'CONFIGURED' ? 'warning' : (task.state === 'ERROR' ? 'danger' : ''))),
          style: 'font-weight: bold;'
        }, task.state),
        h('td', task.deploymentInfo.hostname),
        h('td',
          h('button.btn.btn-default', {
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
