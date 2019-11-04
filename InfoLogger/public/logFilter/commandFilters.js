import {h} from '/js/src/index.js';

/**
 * Filtering main options, in toolbar, top-right.
 * - severity
 * - level
 * - limit
 * - reset
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  h('',
    h('.btn-group', [
      buttonSeverity(model, 'Debug', 'Match severity debug', 'D'),
      buttonSeverity(model, 'Info', 'Match severity info', 'I'),
      buttonSeverity(model, 'Warn', 'Match severity warnings', 'W'),
      buttonSeverity(model, 'Error', 'Match severity errors', 'E'),
      buttonSeverity(model, 'Fatal', 'Match severity fatal', 'F')
    ]),
    h('span.mh3'),
    h('.btn-group', [
      buttonFilterLevel(model, 'Shift', 1),
      buttonFilterLevel(model, 'Oncall', 6),
      buttonFilterLevel(model, 'Devel', 11),
      buttonFilterLevel(model, 'Debug', null),
    ]),
    h('span.mh3'),
    h('.btn-group', [
      buttonLogLimit(model, '1k', 1000),
      buttonLogLimit(model, '10k', 10000),
      buttonLogLimit(model, '100k', 100000),
    ]),
    h('span.mh3'),
    buttonReset(model))
];

/**
 * Makes a button to toggle severity
 * @param {Object} model
 * @param {string} label - button's label
 * @param {string} title - button's title on mouse over
 * @param {string} value - a char to represent severity: W E F or I, can be many with spaces like 'W E'
 * @return {vnode}
 */
const buttonSeverity = (model, label, title, value) => h('button.btn', {
  className: model.log.filter.criterias.severity.in.includes(value) ? 'active' : '',
  onclick: (e) => {
    model.log.setCriteria('severity', 'in', value);
    e.target.blur(); // remove focus so user can 'enter' without actually toggle again the button
  },
  title: title
}, label);

/**
 * Makes a button to set filtering level (shifter, debug, etc) with number
 * @param {Object} model
 * @param {string} label - button's label
 * @param {number} value - maximum level of filtering, from 1 to 21
 * @return {vnode}
 */
const buttonFilterLevel = (model, label, value) => h('button.btn', {
  className: model.log.filter.criterias.level.max === value ? 'active' : '',
  onclick: () => model.log.setCriteria('level', 'max', value),
  title: `Filter level ≤ ${value}`
}, label);

/**
 * Makes a button to set log limit, maximum logs in memory
 * @param {Object} model
 * @param {string} label - button's label
 * @param {number} limit - how much logs to keep in memory
 * @return {vnode}
 */
const buttonLogLimit = (model, label, limit) => h('button.btn', {
  className: model.log.limit === limit ? 'active' : '',
  onclick: () => model.log.setLimit(limit),
  title: `Keep only ${label} logs in the view`
}, label);

/**
 * Makes a button to reset filters
 * @param {Object} model
 * @return {vnode}
 */
const buttonReset = (model) => h('button.btn', {
  onclick: (e) => {
    model.log.filter.resetCriterias(e);
  },
  title: 'Reset date, time, matches, excludes, log levels'
}, 'Reset filters');
