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
import pageLoading from '../common/pageLoading.js';

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
export const content = (model) => h('.scroll-y.absolute-fill.flex-column', [
  createTableForDependenciesInfo(model.frameworkInfo),
  statusAliEcs(model.frameworkInfo.aliecs),
  statusAliEcsServices(model.frameworkInfo.integratedServices),
]);

/**
 * Show COG and its dependencies info based on request status
 * @param {Object} frameworkInfo
 * @return {vnode}
 */
const createTableForDependenciesInfo = (frameworkInfo) =>
  h('.p2', [
    Object.keys(frameworkInfo.statuses).map((dependency) =>
      h('.shadow-level1', [
        h('table.table.table-sm', {style: 'white-space: pre-wrap;'}, [
          h('tbody', [
            buildStatusAndLabelRow(dependency, frameworkInfo.statuses[dependency]),
            buildContentRows(frameworkInfo.statuses[dependency]),
          ])
        ])
      ])
    )
  ]);

/**
 * Create a row element which contains the status and name of the dependency
 * Will display icons based on status (loading, successful, error)
 * @param {String} label - name of the dependency
 * @param {RemoteData} content
 * @returns {vnode}
 */
const buildStatusAndLabelRow = (label, content) =>
  h('tr',
    h('th.flex-row', [
      content.match({
        NotAsked: () => null,
        Loading: () => pageLoading(1, 0),
        Failure: (_) => [
          h('.badge.bg-danger.white.f6', '✕'),
          h('.mh2', {style: 'text-decoration: underline'}, label.toLocaleUpperCase()),
        ],
        Success: (item) => [
          item.status && item.status.ok &&
          h('label.badge.bg-success.white.f6', '✓'),
          item.status && !item.status.ok &&
          h('.badge.bg-danger.white.f6', '✕'),
          h('.mh2', {style: 'text-decoration: underline'},
            content.payload.name || label.toLocaleUpperCase()
          ),
        ]
      }),
    ])
  );

/**
 * Build the rows containing information about the dependency
 * @param {RemoteData} content 
 * @returns {vnode}
 */
const buildContentRows = (content) =>
  content.match({
    NotAsked: () => null,
    Loading: () => null,
    Failure: (error) => h('tr.danger', [
      h('th.w-25', 'error'),
      h('td', error),
    ]),
    Success: (item) => Object.keys(item).map((name) =>
      name === 'status' ?
        !item['status'].ok &&
        h('tr.danger', [
          h('th.w-25', 'error'),
          h('td', item['status'].message),
        ])
        :
        h('tr', [
          h('th.w-25', name),
          h('td', JSON.stringify(item[name])),
        ])
    )
  });

/**
 * Show status and info of AliECS
 * @param {RemoteData} aliecs
 * @return {vnode}
 */
const statusAliEcs = (aliecs) =>
  h('.ph2',
    h('.shadow-level1',
      h('table.table.table-sm', {style: 'white-space: pre-wrap;'}, [
        h('tbody', [
          buildStatusAndLabelRow('aliecs', aliecs),
          buildContentRows(aliecs),
        ])
      ])
    )
  );

/**
 * Show status and info of AliECS Integrated Services
 * @param {RemoteData} services
 * @return {vnode}
 */
const statusAliEcsServices = (services) =>
  services.match({
    NotAsked: () => null,
    Loading: () => pageLoading(1, 0), // TODO
    Failure: (_) =>
      h('.ph2',
        h('.shadow-level1',
          h('table.table.table-sm', {style: 'white-space: pre-wrap;'},
            h('tbody', [
              h('tr',
                h('th.flex-row', [
                  h('.badge.bg-danger.white.f6', '✕'),
                  h('.mh2', {style: 'text-decoration: underline'}, 'Integrated Services')
                  // Add here error message
                ])
              )
            ])
          )
        )
      ),
    Success: (data) => [
      Object.keys(data).map((serviceKey) =>
        h('.ph2',
          h('.shadow-level1',
            h('table.table.table-sm', {style: 'white-space: pre-wrap;'},
              h('tbody', [
                buildStatusAndLabelRowIntService(serviceKey, data[serviceKey]),
                // buildContentRows(data[serviceKey])
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
        )
      )
    ]
  });

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
