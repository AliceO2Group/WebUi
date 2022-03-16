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

import {h, iconPlus} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import {parseObject, parseOdcStatusPerEnv} from './../common/utils.js';
import {detectorHeader} from '../common/detectorHeader.js';
import {infoLoggerButton} from './components/buttons.js';
import {ROLES} from './../workflow/constants.js';

/**
 * @file Page to show a list of environments (content and header)
 */

/**
 * Header of page showing list of environments
 * With one button to create a new environment and page title
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environments')
  ]),
  h('.flex-grow text-right', [
    h('button.btn', {onclick: () => model.router.go('?page=newEnvironment')}, iconPlus())
  ])
];

/**
 * Scrollable list of environments or page loading/error otherwise
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center', [
  detectorHeader(model),
  model.environment.list.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data.environments),
    Failure: (error) => errorPage(error),
  }),
  h('hr'),
  model.environment.requests.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showRequests(data.requests, data.now),
    Failure: (error) => errorPage(error)
  })
]);

/**
 * Show a list of environments with a button to edit each of them
 * Print a message if the list is empty.
 * @param {Object} model
 * @param {Array.<Environment>} list
 * @return {vnode}
 */
const showContent = (model, list) =>
  (list && Object.keys(list).length > 0)
    ? h('.scroll-auto', environmentsTable(model, list))
    : h('h3.m4', ['No environments found.']);

/**
 * Show list of create env request to AliECS core as a table
 * @param {array} requests List of requested stored in the backend
 * @param {Date} now Current date according to backend
 */
const showRequests = (requests, now) =>
  (requests && requests.length > 0)
    ? requestsTable(requests, now)
    : h('h3.m4', ['No requests found.']);

/**
 * Calculate duration from two dates and pretify result
 * @param {Date} now Current date
 * @param {Date} startDate Date when a request was cached
 */
const durationDisplay = (now, startDate) => {
  const seconds = (new Date(now).getTime() - new Date(startDate).getTime())/1000;
  return seconds < 100 ? Math.floor(seconds) + ' s' : Math.floor(seconds / 60) + 'm' + Math.ceil(seconds % 60)
}

/**
 * Renders table of requests based on backend info
 * @param {array} requests List of requests
 * @param {Date} now Current date
 */
const requestsTable = (requests, now) =>
  h('table.table', [
    h('thead', [
      h('tr.table-primary',  h('th', {colspan: 4}, 'Environment requests')),
      h('tr', [['Detectors', 'Workflow', 'Created by', 'When'].map((header) =>
        h('th', {style: 'text-align: center;'}, header)
      )])
    ]),
    h('tbody', [
      requests.map(item => h('tr', [
        h('td', {style: 'text-align: center;'}, item.detectors),
        h('td', {style: 'text-align: center;'}, item.workflow.substring(item.workflow.lastIndexOf('/') + 1)),
        h('td', {style: 'text-align: center;'}, item.owner),
        h('td', {style: 'text-align: center;'}, durationDisplay(now, item.date)),
      ]))
    ])
  ]);

/**
 * Create the table of environments
 * @param {Object} model
 * @param {Array<String>} list
 * @return {vnode}
 */
const environmentsTable = (model, list) => {
  const tableHeaders = [
    'ID', 'Run', 'Created', 'Detectors', 'FLPs', 'DCS', 'TRG', 'EPN', 'ODC', 'EPN Topology', 'State', 'Actions'
  ];
  return h('table.table', [
    h('thead', [
      h('tr.table-primary',  h('th', {colspan: 12}, 'Created environments')),
      h('tr', [tableHeaders.map((header) => h('th', {style: 'text-align: center;'}, header))])
    ]),
    h('tbody', [
      list.map((item) => h('tr', {
        class: _isGlobalRun(item.userVars) ? 'global-run' : ''
      }, [
        h('td', {style: 'text-align: center;'}, item.id),
        h('td', {style: 'text-align: center;'}, item.currentRunNumber ? item.currentRunNumber : '-'),
        h('td', {style: 'text-align: center;'}, parseObject(item.createdWhen, 'createdWhen')),
        h('td', {style: 'text-align: center;'}, [
          item.includedDetectors && item.includedDetectors.length > 0 ?
            item.includedDetectors.map((detector) => `${detector} `)
            : '-'
        ]),
        h('td', {style: 'text-align: center;'}, item.numberOfFlps),
        h('td', {style: 'text-align: center;'}, parseObject(item.userVars, 'dcs_enabled')),
        h('td', {style: 'text-align: center;'}, parseObject(item.userVars, 'trg_enabled')),
        h('td', {style: 'text-align: center;'}, parseObject(item.userVars, 'epn_enabled')),
        h('td', {style: 'text-align: center;'}, parseOdcStatusPerEnv(item.id, model)),
        h('td', {style: 'text-align: center;'}, parseObject(item.userVars, 'odc_topology')),
        h('td', {
          class: (item.state === 'RUNNING' ?
            'success'
            : (item.state === 'CONFIGURED' ? 'warning' : (item.state === 'ERROR' ? 'danger' : ''))),
          style: 'font-weight: bold; text-align: center;'
        }, item.state
        ),
        h('td', {style: 'text-align: center;'}, actionsCell(model, item))
      ]),
      ),
    ]),
  ]);
};

/**
 * Return a button if detector of the environment is among
 * the ones belonging the environment
 * @param {Object} model
 * @param {JSON} item
 * @return {vnode}
 */
const actionsCell = (model, item) => {
  const isDetectorIncluded =
    item.includedDetectors.length === 1 && item.includedDetectors[0] === model.detectors.selected;
  if ((isDetectorIncluded || !model.detectors.isSingleView()) && model.isAllowed(ROLES.Detector)) {
    return h('.btn-group', [
      h('button.btn.btn-primary', {
        title: 'Open the environment page with more details',
        onclick: () => model.router.go(`?page=environment&id=${item.id}`),
      }, 'Details'),
      infoLoggerButton(item, 'ILG'),
      // bookkeepingButton('BKP'),
      // qcgButton('QCG'),
    ]);
  } else {
    return h('', '')
  }
}

/**
 * Checks if a run is considered global
 * @param {JSON} vars 
 * @returns {boolean}
 */
const _isGlobalRun = (vars) => {
  return vars['trg_enabled'] === 'true' && vars['trg_global_run_enabled'] === 'true';
}
