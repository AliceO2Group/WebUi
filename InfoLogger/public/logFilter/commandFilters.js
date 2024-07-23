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
  h(
    '',
    h('.btn-group', [
      buttonSeverity(model, 'Debug', 'Match severity debug', 'D'),
      buttonSeverity(model, 'Info', 'Match severity info', 'I'),
      buttonSeverity(model, 'Warn', 'Match severity warnings', 'W'),
      buttonSeverity(model, 'Error', 'Match severity errors', 'E'),
      buttonSeverity(model, 'Fatal', 'Match severity fatal', 'F'),
    ]),
    h('span.mh3'),
    h('.btn-group', [
      buttonFilterLevel(model, 'Ops', 1),
      buttonFilterLevel(model, 'Support', 6),
      buttonFilterLevel(model, 'Devel', 11),
      buttonFilterLevel(model, 'Trace', null), // 21
    ]),
    h('span.mh3'),
    h('.btn-group', [
      buttonLogLimit(model, '100k', 100000),
      buttonLogLimit(model, '500k', 500000),
      buttonLogLimit(model, '1M', 1000000),
    ]),
    h('span.mh3'),
    buttonReset(model),
  ),
];

/**
 * Makes a button to toggle severity
 * @param {Model} model - root model of the application
 * @param {string} label - button's label
 * @param {string} title - button's title on mouse over
 * @param {string} value - a char to represent severity: W E F or I, can be many with spaces like 'W E'
 * @returns {vnode} - the button to toggle severity
 */
const buttonSeverity = (model, label, title, value) => h('button.btn', {
  className: model.log.filter.criterias.severity.in.includes(value) ? 'active' : '',
  onclick: (e) => {
    model.log.setCriteria('severity', 'in', value);
    e.target.blur(); // remove focus so user can 'enter' without actually toggle again the button
  },
  title: title,
}, label);

/**
 * Makes a button to set filtering level (shifter, debug, etc) with number
 * @param {Model} model - root model of the application
 * @param {string} label - button's label
 * @param {number} value - maximum level of filtering, from 1 to 21
 * @returns {vnode} - component representing the creation of a button for filtering
 */
const buttonFilterLevel = (model, label, value) => h('button.btn', {
  className: model.log.filter.criterias.level.max === value ? 'active' : '',
  onclick: () => model.log.setCriteria('level', 'max', value),
  title: `Filter level ≤ ${value}`,
}, label);

/**
 * Makes a button to set log limit, maximum logs in memory
 * @param {Model} model - root model of the application
 * @param {string} label - button's label
 * @param {number} limit - how much logs to keep in memory
 * @returns {vnode} - component representing the creation of a button for log limit
 */
const buttonLogLimit = (model, label, limit) => h('button.btn', {
  className: model.log.limit === limit ? 'active' : '',
  onclick: () => model.log.setLimit(limit),
  title: `Keep only ${label} logs in the view`,
}, label);

/**
 * Makes a button to reset filters
 * @param {Model} model - root model of the application
 * @returns {vnode} - component representing the creation of a button to reset filters
 */
const buttonReset = (model) => h('button.btn', {
  onclick: () => model.log.filter.resetCriteria(),
  title: 'Reset date, time, matches, excludes, log levels',
}, 'Reset filters');
