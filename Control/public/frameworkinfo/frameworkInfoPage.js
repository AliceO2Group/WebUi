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

import {h} from '/js/src/index.js';
import {loadingStateInfoTable, successfulStateInfoTable, failureStateInfoTable} from './stateTables.js';

/**
 * @file Page to FrameworkInfo(About) (content and header)
 */

/**
 * Header of the about page
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'About')),
  h('.flex-grow text-right', [])
];

/**
 * Content of the status page (or frameworkinfo)
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.flex-column.p2', [
  tablesForDependenciesInfo(model.frameworkInfo),
  tableAliEcsInfo(model.frameworkInfo.aliecs),
  tableIntegratedServicesInfo(model.frameworkInfo.integratedServices),
]);

/**
 * Show COG and its direct dependencies info based on request status
 * @param {FrameworkInfo} frameworkInfo
 * @return {vnode}
 */
const tablesForDependenciesInfo = (frameworkInfo) => [
  Object.keys(frameworkInfo.statuses).map((dependency) =>
    frameworkInfo.statuses[dependency].match({
      NotAsked: () => null,
      Loading: () => loadingStateInfoTable(dependency),
      Failure: (error) => failureStateInfoTable(dependency, error),
      Success: (data) => successfulStateInfoTable(dependency, data),
    })
  )
];

/**
 * Show status and info of AliECS
 * @param {RemoteData} aliecs
 * @return {vnode}
 */
const tableAliEcsInfo = (aliecs) =>
  aliecs.match({
    NotAsked: () => null,
    Loading: () => loadingStateInfoTable('AliECS Core'),
    Failure: (error) => failureStateInfoTable('AliECS Core', error),
    Success: (item) => successfulStateInfoTable('AliECS Core', item)
  });

/**
 * Show status and info of AliECS Integrated Services
 * @param {RemoteData} services
 * @return {vnode}
 */
const tableIntegratedServicesInfo = (services) =>
  h('.pv2',
    services.match({
      NotAsked: () => null,
      Loading: () => loadingStateInfoTable('Integrated Services'),
      Failure: (data) =>
        h('.shadow-level1',
          h('table.table.table-sm', {style: 'white-space: pre-wrap;'},
            h('tbody', [
              h('tr', h('th.flex-row', [
                h('.badge.bg-danger.white.f6', '✕'),
                h('.mh2', {style: 'text-decoration: underline'}, 'INTEGRATED SERVICES'),
                h('.mh5', data.message)
              ]))
            ])
          )
        ),
      Success: (data) => [
        Object.keys(data).map((serviceKey) => [
          h('.shadow-level1',
            h('table.table.table-sm', {style: 'white-space: pre-wrap;'},
              h('tbody', [
                buildStatusAndLabelRowIntService(serviceKey, data[serviceKey]),
                Object.keys(data[serviceKey]).filter((name) => name !== 'name')
                  .map((name) =>
                    h('tr', [
                      h('th.w-25', name),
                      h('td', JSON.stringify(data[serviceKey][name])),
                    ])
                  )
              ])
            )
          )
        ])
      ]
    })
  );

/**
 * Create a row element which contains the status and name of the dependency
 * Will display icons based on status (loading, successful, error)
 * @param
 * @returns {vnode}
 */
const buildStatusAndLabelRowIntService = (label, service) => {
  const isServiceConfigured = Object.keys(service).length > 0;
  if (isServiceConfigured) {
    return h('tr',
      h('th.flex-row', [
        service.connectionState === 'CONNECTING' && h('.badge.bg-warning.white.f6', '...'),
        service.connectionState === 'TRANSIENT_FAILURE' && h('.badge.bg-danger.white.f6', '✕'),
        service.connectionState === 'READY' && h('.badge.bg-success.white.f6', '✓'),
        (
          service.connectionState === 'IDLE' ||
          service.connectionState === 'SHUTDOWN'
        ) && h('.badge.bg-gray.white.f6', '?'),
        h('.mh2', {style: 'text-decoration: underline'},
          service.name || label.toLocaleUpperCase()
        ),
      ])
    );
  } else {
    // Empty value from AliECS Core means service was not enabled
    return h('tr',
      h('th.flex-row', [
        h('.badge.bg-gray.white.f6', '?'),
        h('.mh2', {style: 'text-decoration: underline'},
          label.toLocaleUpperCase(),
        ),
        h('.mh5', '- Service was not enabled')
      ])
    );
  }
};
