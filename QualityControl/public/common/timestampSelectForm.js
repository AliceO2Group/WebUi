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

import { h } from '/js/src/index.js';
import { prettyFormatDate } from './utils.js';

/**
 * Display a select form with the latest timestamps of the current selected object
 * @param {object} config - root model of the application
 * @param {Array<{id: string, createdAt: string}>} config.versions - list of versions to display
 * @param {string|null} config.selectedId - currently selected version id
 * @param {onselect} config.onSelect - callback when a version is selected
 * @returns {vnode} - virtual node element
 */
export const timestampSelectForm = ({ versions = [], selectedId = null, onSelect }) =>
  h(
    '.w-100.flex-row',
    h('select.form-control.gray-darker.text-center', {
      onchange: (e) => {
        const { value } = e.target;
        if (value && value !== 'Invalid Timestamp') {
          onSelect?.(JSON.parse(value));
        }
      },
    }, versions.map((version) => versionOptionNode(version, selectedId === version.id))),
  );

/**
 * Create an option HTML element for a version
 * @param {object} version - version object
 * @param {string} version.id - version id
 * @param {string} version.createdAt - version creation timestamp
 * @param {boolean} isSelected - whether the version is selected
 * @returns {vnode} - virtual node element
 */
const versionOptionNode = (version, isSelected = false) => {
  const versionString = JSON.stringify(version);
  return h('option.text-center', {
    id: versionString,
    key: versionString,
    value: versionString,
    selected: isSelected,
  }, [
    'Created: ',
    prettyFormatDate(version.createdAt),
    ' (id: ',
    version.id,
    ')',
  ]);
};
