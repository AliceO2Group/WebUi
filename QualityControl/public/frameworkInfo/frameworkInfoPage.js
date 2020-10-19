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

/**
 * Shows a page to view framework information
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.p2.absolute-fill.text-center',
  model.frameworkInfo.item.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (data) => showContent(data),
    Failure: (error) => showContent({error: {message: error}}),
  })
);

/**
* Display a table with QC GUI and its dependencies status
* @param {Object} item
* @return {vnode}
*/
const showContent = (componentList) =>
  Object.keys(componentList).map((component) => [
    h('.shadow-level1', [
      h('table.table', {
        style: 'white-space: pre-wrap;'
      }, [
        h('tbody', [
          h('tr',
            h('th.flex-row', componentHeader(componentList[component].status, component))
          ),
          Object.keys(componentList[component]).map((name) => componentInfoRow(name, componentList[component]))])
      ])
    ])
  ]);

/**
 * Display the header of the component with a green check or
 * red x depending on the status
 * @param {JSON} status { <ok>: boolean, [message]: string}
 * @param {string} component
 * @return {vnode}
 */
const componentHeader = (status, component) => [
  status && status.ok && h('.badge.bg-success.white.f6', '✓'),
  status && !status.ok && h('.badge.bg-danger.white.f6', '✕'),
  h('.mh2', {style: 'text-decoration: underline'}, component.toUpperCase()),
];


/**
 * Create a row with 2 columns: name and value
 * containing information about a sub-property of the component
 * @param {string} name - sub-property of component
 * @param {string} componentProps
 * @return {vnode}
 */
const componentInfoRow = (name, componentProps) =>
  name === 'status' ?
    !componentProps.status.ok &&
    h('tr.danger', [
      h('th.w-25', 'error'),
      h('td', componentProps.status.message),
    ])
    :
    h('tr', [
      h('th.w-25', name),
      h('td', JSON.stringify(componentProps[name])),
    ]);
