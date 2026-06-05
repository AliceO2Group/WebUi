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

/**
 * Filtering main options, in toolbar, top-right.
 * - severity
 * - level
 * - limit
 * - reset
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of filters panel
 */
export default (model) => [
  h('.btn-group', [
    buttonSeverity(model, 'Debug', 'Match severity debug', 'D'),
    buttonSeverity(model, 'Info', 'Match severity info', 'I'),
    buttonSeverity(model, 'Warn', 'Match severity warnings', 'W'),
    buttonSeverity(model, 'Error', 'Match severity errors', 'E'),
    buttonSeverity(model, 'Fatal', 'Match severity fatal', 'F'),
  ]),
  selectFilterLevel(model.log),
  selectLogLimit(model.log),
  buttonReset(model),
];

/**
 * Makes a button to toggle severity
 * @param {Model} model - root model of the application
 * @param {string} label - button's label
 * @param {string} title - button's title on mouse over
 * @param {string} value - a char to represent severity: W E F or I, can be many with spaces like 'W E'
 * @returns {vnode} - the button to toggle severity
 */
const buttonSeverity = (model, label, title, value) => {
  const disabled = model.log.filter.isSeverityDisabled(value);
  return h('button.btn', {
    className: disabled ? 'disabled' : model.log.filter.criterias.severity.in.includes(value) ? 'active' : '',
    onclick: disabled ? null : (e) => {
      model.log.setCriteria('severity', 'in', value);
      e.target.blur();
    },
    disabled,
    title: disabled ? `${label} is not available at the current log level` : title,
  }, label);
};

/**
 * Build a vnode for a select component with given options and onchange callback
 * @param {string} title - tooltip shown on hover
 * @param {string} id - id of the element
 * @param {Array<{label: string, value: string, selected: boolean}>} options - list of options to render
 * @param {void} onchange - callback receiving the raw string value from the select
 * @returns {vnode} - component representing the select element
 */
const selectBtn = (title, id, options, onchange) => h(
  'select.select-btn',
  {
    id,
    title,
    onchange: (e) => onchange(e.target.value),
  },
  options.map(({ label, value, selected }) => h('option', { value, selected }, label)),
);

/**
 * Makes a select to set filtering level (Ops, Support, Devel, Trace)
 * @param {Log} logModel - log model of the application
 * @returns {vnode} - component representing the selection of a log level filter
 */
const selectFilterLevel = (logModel) => selectBtn(
  'Filter by log level',
  'filter-level',
  [
    { label: 'Ops', value: '1', selected: logModel.filter.criterias.level.max === 1 },
    { label: 'Support', value: '6', selected: logModel.filter.criterias.level.max === 6 },
    { label: 'Devel', value: '11', selected: logModel.filter.criterias.level.max === 11 },
    { label: 'Trace', value: '', selected: logModel.filter.criterias.level.max === null },
  ],
  (value) => logModel.setCriteria('level', 'max', value === '' ? null : parseInt(value, 10)),
);

/**
 * Makes a select to set the maximum number of logs to keep in memory
 * @param {Log} logModel - log model of the application
 * @returns {vnode} - component representing the selection of a log limit
 */
const selectLogLimit = (logModel) => selectBtn(
  'Maximum logs to keep in the view',
  'log-limit',
  [
    { label: '100k', value: '100000', selected: logModel.limit === 100000 },
    { label: '500k', value: '500000', selected: logModel.limit === 500000 },
    { label: '1M', value: '1000000', selected: logModel.limit === 1000000 },
  ],
  (value) => logModel.setLimit(parseInt(value, 10)),
);

/**
 * Makes a button to reset filters
 * @param {Model} model - root model of the application
 * @returns {vnode} - component representing the creation of a button to reset filters
 */
const buttonReset = (model) => h('button.btn', {
  onclick: () => model.log.filter.resetCriteria(),
  title: 'Reset date, time, matches, excludes, log levels',
}, 'Reset filters');
