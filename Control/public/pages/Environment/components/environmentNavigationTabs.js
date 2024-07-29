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
  h, iconChevronBottom, iconLockLocked, iconLockUnlocked, iconChevronTop, iconCircleX
} from '/js/src/index.js';
import {ALIECS_STATE_COLOR} from '../../../common/constants/stateColors.js';
import {currentPageAndParameters} from '../../../utilities/currentPageAndParameters.js';
import {getTasksByFlp, getTasksByEpn} from '../../../common/utils.js';
import {isGlobalRun} from '../../../environment/environmentsPage.js';
import {miniCard} from '../../../common/card/miniCard.js';
import {parseObject, parseOdcStatusPerEnv} from '../../../common/utils.js';
import {rowForCard} from '../../../common/card/rowForCard.js';
import {userVarsRow, defaultsRow, varsRow} from './expandableEnvRows.js';
import pageLoading from '../../../common/pageLoading.js';
import showTableItem from '../../../common/showTableItem.js';
import { infoLoggerButtonLink } from '../../../common/buttons/infoLoggerRedirectButton.js';
import { redirectButtonLink } from '../../../common/buttons/redirectButtonLink.js';


/**
 * @file Builds the navigation tabs that are to be displayed on the environment details page which contains the following tabs:
 * - General - contains most used information of an environment presented in a user-friendly way
 * - Configuration - contains the configuration variables
 * - EPN - contains the tasks grouped by EPN
 * - FLP - contains the tasks grouped by FLP
 * - QC - contains the tasks grouped by QC
 * - TRG - contains the tasks grouped by TRG
 */

/**
 * Builds the navigation tabs that are to be displayed on the environment details page
 * @param {Model} model - the root model of the application
 * @param {EnvironmentInfo} environment - the environment to display
 */
export const environmentNavigationTabs = (model, item) => {
  const {hardware: {flp, qc, epn, trg}} = item;
  const panels = {
    general: {
      name: 'General',
      content: environmentGeneralInfoContent
    },
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
    h('ul.nav.nav-tabs.m0', [
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
    h('.tab-content', Object.entries(panels)
      .map(([id, {content}]) => {
        const isActive = parameters.panel === id;
        if (isActive) {
          return h(`.tab-pane${isActive ? '.active' : ''}`, {id: `${id}-pane`}, content(model.environment, item))
        }
      })
    )
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
  const {tasks = [], currentTransition = ''} = environment;
  if (tasks.length === 0 && !currentTransition) {
    return h('.text-center.w-100', 'No tasks found');
  }
  const tasksByFlp = getTasksByFlp(tasks);
  return [Object.keys(tasksByFlp).map((host) =>
    h('', [
      h('.p2.flex-row.bg-primary.white', [
        h('h5.flex-grow-3', host),
        h('.flex-row.flex-grow-1.g2', [
          infoLoggerButtonLink({ run: environment.currentRunNumber, hostname: host }, 'InfoLogger FLP', COG.ILG_URL),
          redirectButtonLink(tasksByFlp[host].stdout, 'Mesos', 'Download Mesos logs', true),
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
  const {tasks = [], currentTransition = ''} = environment;
  const tasksByHosts = getTasksByEpn(tasks);
  if (tasks.length === 0 && !currentTransition) {
    return h('.text-center.w-100', 'No tasks found');
  }
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

/**
 * Returns content for a mini card containing specific environment general details
 * @param {Environment} environmentModel - model of the environment
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentGeneralInfoContent = (environmentModel, environment) => {
  const {currentTransition = '-', userVars = {}, createdWhen, rootRole, hardware = {epn: {}}} = environment;
  const {epn: {info}} = hardware;
  const {state: odcState, styleClass: odcStyle} = parseOdcStatusPerEnv(environment);

  return miniCard(
    '',
    [
      h('.flex-column.', [
        rowForCard('Global:', isGlobalRun(userVars) ? 'ON' : '-'),
        rowForCard('Transitioning:', currentTransition),
        rowForCard('ENV Created:', parseObject(createdWhen, 'createdWhen')),
        rowForCard('RUN Started:', parseObject(userVars['run_start_time_ms'], 'run_start_time_ms')),
        rowForCard('RUN Ended:', parseObject(userVars['run_end_time_ms'], 'run_end_time_ms')),
        rowForCard('Run Type:', userVars.run_type),
        rowForCard('Template:', rootRole),
        rowForCard('DCS:', parseObject(userVars, 'dcs_enabled')),
        rowForCard('Data Distribution (FLP):', parseObject(userVars, 'dd_enabled')),
        rowForCard('ODC:', odcState, {valueClasses: [odcStyle]}),
        rowForCard('DDS:', info.ddsSessionStatus ? info.ddsSessionStatus : '-'),
        info.ddsSessionStatus && rowForCard('DDS Session ID:', info.ddsSessionId ? info.ddsSessionId : '-'),
      ])
    ],
    isGlobalRun(environment.userVars)
      ? ['bg-global-run', 'p2', 'g2']
      : ['p2', 'g2']
  );
};
