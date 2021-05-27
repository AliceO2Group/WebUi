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
 * Creates a 1-row table with a loading icon and upper case label
 * @param {String} label 
 * @returns {vnode}
 */
const loadingStateInfoTable = (label) =>
  h('.shadow-level1.mv1',
    h('table.table.table-sm', {style: 'white-space: pre-wrap; margin-bottom: 0'},
      h('tbody', [
        h('tr', h('th.flex-row', [
          pageLoading(1, 0),
          h('.mh2', {style: 'text-decoration: underline'}, label.toLocaleUpperCase()),
        ]))
      ])
    )
  );

/**
 * Creates a table with a x icon and details about the issue
 * @param {String} label
 * @param {String} message
 * @param {JSON} content 
 * @returns {vnode}
*/
const failureStateInfoTable = (label, error = undefined) =>
  h('.shadow-level1.mv1',
    h('table.table.table-sm', {style: 'white-space: pre-wrap; margin-bottom: 0'},
      h('tbody', [
        h('tr', h('th.flex-row', [
          h('.badge.bg-danger.white.f6', '✕'),
          h('.mh2', {style: 'text-decoration: underline'}, label.toLocaleUpperCase()),
        ])),
        error && h('tr.danger', [
          h('th.w-25', 'error'),
          h('td', error),
        ]),
      ])
    )
  );

/**
 * Creates a table with a succesful status and details about the service
 * @param {String} label 
 * @param {JSON} item 
 * @returns {vnode}
*/
const successfulStateInfoTable = (label, dependency) =>
  h('.shadow-level1.mv1',
    !dependency.status.ok && !dependency.status.configured ?
      unconfiguredStateInfoTable(label)
      :
      h('table.table.table-sm', {style: 'white-space: pre-wrap; margin-bottom: 0'},
        h('tbody', [
          h('tr',
            h('th.flex-row', [
              dependency.status && dependency.status.ok &&
              h('label.badge.bg-success.white.f6', '✓'),
              dependency.status && !dependency.status.ok &&
              h('.badge.bg-danger.white.f6', '✕'),
              h('.mh2', {style: 'text-decoration: underline'}, label.toLocaleUpperCase()
              ),
            ])
          ),
          Object.keys(dependency).map((name) =>
            name === 'status' ?
              !dependency['status'].ok &&
              h('tr.danger', [
                h('th.w-25', 'error'),
                h('td', dependency['status'].message),
              ])
              :
              h('tr', [
                h('th.w-25', name),
                h('td', JSON.stringify(dependency[name])),
              ])
          )
        ])
      )
  );

/**
 * Creates a table with a grey ? icon and the name of the service
 * It also displays an informative message that the service was not configured
 * @param {String} label - Name of the service
 * @returns 
 */
const unconfiguredStateInfoTable = (label) =>
  h('table.table.table-sm', {style: 'white-space: pre-wrap; margin-bottom: 0'},
    h('tbody', [
      h('tr',
        h('th.flex-row', [
          h('.badge.bg-gray.white.f6', '?'),
          h('.mh2', {style: 'text-decoration: underline'},
            label.toLocaleUpperCase(),
          ),
          h('.mh5', '- Service was not enabled')
        ])
      )
    ]));

export {loadingStateInfoTable, failureStateInfoTable, successfulStateInfoTable};
