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

import { getKnownVariableLabel } from '../../../utilities/getKnownVariableLabel.js';
import {h, iconChevronTop, iconChevronBottom} from '/js/src/index.js';

/**
 * Build an html table row which can be expanded to view all data contained in the passed object
 * In a non-expanded state, the object is stringified and displayed in a single line
 * In an expanded state, each key-value pair is displayed on a new line
 * @param {object} data - object with KV pairs of data in a JSON format
 * @param {string} label - label to be displayed in the first column
 * @param {boolean} isExpanded - flag to indicate if the row is expanded or not
 * @param {function} onclick - function to be called when the row is clicked to expand
 * @returns {vnode} - html table row
 */
export const expandableObjectRow = (data, label, isExpanded = false, onclick) => {
  if (!data || Object.keys(data).length === 0) {
    data = undefined;
  }
  return h('tr', [
    h('th.w-15',
      h('.flex-row', [
        h('.w-75', label),
        data && h('.w-25.text-right.mh2.actionable-icon', {
          onclick
        }, isExpanded ? iconChevronTop() : iconChevronBottom()
        ),
      ])
    ),
    h('td.flex-row', (!isExpanded || !data) 
      ? h('.mh2.overflow', JSON.stringify(data ?? {}))
      : objectPanel(data)
    ),
  ])
};

/**
 * Build properties of the userVars each on new line and with known variables
 * custom view
 * @param {object} pairs - object with multiple key-value pairs
 * @return {vnode} - panel which sorts the keys and displays them in a table
*/
const objectPanel = (pairs) => {
  const knownVarGroups = Object.keys(pairs)
    .filter((key) => isKeyInRadioGroup(key))
    .sort((keyA, keyB) => keyA.toLocaleUpperCase() < keyB.toLocaleUpperCase() ? -1 : 1);

  const uriVarGroups = Object.keys(pairs)
    .filter((key) => isPairInConsulUriGroup(key, pairs[key]));

  const unknownVarGroups = Object.keys(pairs)
    .filter((key) => !isKeyInRadioGroup(key) && !isPairInConsulUriGroup(key, pairs[key]))
    .sort((keyA, keyB) => keyA.toLocaleUpperCase() < keyB.toLocaleUpperCase() ? -1 : 1);

  return h('.flex-column.w-100', [
    knownVarGroups.map((key) =>
      key !== 'hosts' &&
      h('.flex-row', [
        h('.w-25', `${getKnownVariableLabel(key)}:`),
        h('.w-75.flex-row', [
          h('label.', pairs[key] === 'true' ? 'ON' : 'OFF'),
        ]),
      ])
    ),
    unknownVarGroups.map((key) =>
      h('.w-100.flex-row', [
        h('.w-25', key),
        h('.w-75', {
          style: 'word-break: break-word'
        }, pairs[key])
      ])
    ),
    uriVarGroups.map((key) =>
      h('.w-100.flex-row', [
        h('.w-25', key),
        h('.w-75', {
          style: 'word-break: break-word'
        }, pairs[key])
      ])
    ),
  ]);
};

/**
 * Checks if provided key is part of the known group of URIs and if the value contains 'consul'
 * @param {string} key - key to check if it is in the group
 * @param {string} value - value to check if it contains 'consul'
 * @return {boolean} - true if it meets the criteria
 */
const isPairInConsulUriGroup = (key, value) => {
  return ['qc_config_uri', 'readout_cfg_uri'].includes(key) && value.includes('consul');
};

/**
 * Check if provided key is part of the known group of variables that belong as radio buttons
 * @param {string} key - key to check if it is in the radio group
 * @returns {boolean} - true if the key is in the radio group
 */
const isKeyInRadioGroup = (key) => {
  return [
    'odc_enabled', 'qcdd_enabled', 'dd_enabled', 'ddsched_enabled', 'minimal_dpl_enabled', 'dcs_enabled'
  ].includes(key);
};
