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
* Display a table with cog and its dependencies information
* @param {Object} item
* @return {vnode}
*/
const showContent = (item) =>
  Object.keys(item).map((columnName) => [
    h('.shadow-level1', [
      h('table.table', {
        style: 'white-space: pre-wrap;'
      }, [
        h('tbody', [
          h('tr',
            h('th.w-25', {style: 'text-decoration: underline'}, columnName.toUpperCase())),
          Object.keys(item[columnName]).map((name) =>
            h('tr', [
              h('th.w-25', name),
              h('td', JSON.stringify(item[columnName][name])),
            ])
          )])
      ])
    ])
  ]);
