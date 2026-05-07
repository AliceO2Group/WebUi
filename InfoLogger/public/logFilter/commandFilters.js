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

const LIMIT_LEVELS = [
  { label: '100k', value: 100000 },
  { label: '500k', value: 500000 },
  { label: '1M', value: 1000000 },
];
const SEVERITIES_ALLOWED = [
  { label: 'Debug', value: 'D' },
  { label: 'Info', value: 'I' },
  { label: 'Warn', value: 'W' },
  { label: 'Error', value: 'E' },
  { label: 'Fatal', value: 'F' },
];

/**
 * Filtering main options, in toolbar, top-right.
 * - severity
 * - level
 * - limit
 * - reset
 * @param {Log} logModel - log model of the application
 * @param {{label: string, index:number}[]} filterLevelsAllowed - levels allowed for filtering
 * @returns {vnode} - the view of filters panel
 */
export default (logModel, filterLevelsAllowed) => [
  h(
    '.btn-group',
    SEVERITIES_ALLOWED.map(({ label, value }) => _selectableButtonComponent(
      label,
      {
        id: `severity-${value}`,
        title: `Match severity ${label.toLowerCase()}`,
        isActive: logModel.filter.criterias.severity.in.includes(value),
        onclick: () => logModel.setCriteria('severity', 'in', value),
      },
    )),
  ),

  h(
    '.btn-group',
    filterLevelsAllowed.map(({ label, index, available }) => _selectableButtonComponent(
      label,
      {
        id: `level-${index}`,
        title: available ? `Filter level ≤ ${index}` : `You don't have access to level ${label}`,
        isActive: logModel.filter.criterias.level.max === index,
        onclick: () => logModel.setCriteria('level', 'max', index),
        disabled: !available,
      },
    )),
  ),

  h(
    '.btn-group',
    LIMIT_LEVELS.map(({ label, value }) =>
      _selectableButtonComponent(
        label,
        {
          id: `limit-${value}`,
          title: `Keep only ${value / 1000}k logs in the view`,
          isActive: logModel.limit === value,
          onclick: () => logModel.setLimit(value),
        },
      )),
  ),

  _selectableButtonComponent(
    'Reset filters',
    {
      title: 'Reset date, time, matches, excludes, log levels',
      isActive: false,
      onclick: () => logModel.filter.resetCriteria(),
    },
  ),
];

/**
 * Component representing the creation of a button for filtering header
 * @param {string} label - button's label
 * @param {object} options - options for the button
 * @param {string} options.id - button's id
 * @param {string} options.title - button's title on mouse over
 * @param {boolean} options.isActive - whether the button is active
 * @param {void} options.onclick - function to call when button is clicked
 * @param {boolean} options.disabled - whether the button is disabled
 * @returns {vnode} - component representing the creation of a button for filtering
 */
const _selectableButtonComponent = (label, { id, title, isActive, onclick, disabled }) => h('button.btn', {
  id,
  className: [isActive ? 'active' : '', disabled ? 'disabled' : ''].join(' '),
  onclick,
  title,
  disabled,

}, label);
