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
  model.environment.requests.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showRequests(model, data.requests),
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
 * @param {Object} model
 * @param {array} requests List of requested stored in the backend
 */
const showRequests = (model, requests) =>
  (requests && requests.length > 0) && [h('hr.m4.bg-gray-light'), requestsTable(model, requests)];

/**
 * Renders table of requests based on backend info
 * @param {Object} model
 * @param {array} requests List of requests
 */
const requestsTable = (model, requests) =>
  h('table.table', [
    h('thead', [
      h('tr.primary.bg-white',
        {style: 'border-top: 2px solid var(--color-gray); border-bottom: 1px solid var(--color-gray)'},
        h('th', {colspan: 7}, 'Environment creation requests')
      ),
      h('tr', [['Detectors', 'Workflow', 'Created by', 'When', 'State', 'Message', 'Action'].map((header) =>
        h('th', {style: 'text-align: center;'}, header)
      )])
    ]),
    h('tbody', [
      requests.map(item => h('tr', {style: {background: item.failed ? 'rgba(214, 38, 49, 0.2)' : '' }}, [
        h('td', {style: 'text-align: center;'}, item.detectors),
        h('td', {style: 'text-align: center;'}, item.workflow.substring(
          item.workflow.lastIndexOf('/') + 1, item.workflow.indexOf('@')
        )),
        h('td', {style: 'text-align: center;'}, item.owner),
        h('td', {style: 'text-align: center;'}, new Date(item.date).toLocaleString()),
        h('td', {style: 'text-align: center;font-weight: bold;'}, item.failed ? 'FAILED' : 'ONGOING'),
        h('td.f6', {style: 'text-align: center;'}, item.failed && item.message),
        h('td', {style: 'text-align: center;'}, item.failed && buttonRemoveRequest(model, item.id, item.personid))
      ]))
    ])
  ]);

/**
 * Button to remove request from the table
 * @param {Object} model
 * @param {Number} id Request id (server side generated)
 * @param {Number} personid Person ID
 */
const buttonRemoveRequest = (model, id, personid) =>
  (model.isAllowed(ROLES.Admin) || model.session.personid == personid) &&
  h('button.btn.btn-danger', {
    title: 'Clear failed environemnt from the list',
    onclick: () => model.environment.removeEnvironmentRequest(id)
  }, 'Acknowledge');

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
      h('tr.table-primary',  h('th', {colspan: 12}, 'Active Environments')),
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
