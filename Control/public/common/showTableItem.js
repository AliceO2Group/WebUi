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
import parseObject from './utils.js';

/**
 * Generic table to show properties of an object
 * This can be forked to show more specific data (format date, colors, more buttons...)
 * @param {Object} item - object to be shown
 * @return {vnode} table view
 */
export default (item) => h('table.table.shadow-level2', {style: 'white-space: pre-wrap;'}, [
  h('tbody', Object.keys(item).map((columnName) => h('tr', [
    h('th', columnName),
    typeof item[columnName] === 'object' ?
      h('td', parseObject(item[columnName], columnName)) :
      h('td', item[columnName])
  ]))),
]);
