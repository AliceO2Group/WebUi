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

import { h, iconChevronTop, iconChevronBottom } from '/js/src/index.js';

/**
 * Build an html row which can be expanded to view all information about the environment defaults
 * @param {JSON} defaults
 * @param {Environment} environment
 * @returns {vnode}
 */
const defaultsRow = (defaults, environment) => {
  if (!defaults || Object.keys(defaults).length === 0) {
    defaults = undefined;
  }
  return h('tr', [
    h(
      'th.w-15',
      h('.flex-row', [
        h('.w-75', 'Defaults'),
        defaults && h('.w-25.text-right.mh2.actionable-icon', {
          onclick: () => {
            environment.isExpanded.defaults = !environment.isExpanded.defaults;
            environment.notify();
          },
        }, environment.isExpanded.defaults ? iconChevronTop() : iconChevronBottom()),
      ]),
    ),
    h(
      'td.flex-row',
      !environment.isExpanded.defaults || !defaults ?
        h('.mh2.overflow', JSON.stringify(defaults))
        : expandedKVPanel(environment, defaults),
    ),
  ]);
};

/**
 * Build an html row which can be expanded to view all information about the environment vars
 * @param {JSON} vars
 * @param {Environment} environment
 * @returns {vnode}
 */
const varsRow = (vars, environment) => {
  if (!vars || Object.keys(vars).length === 0) {
    vars = undefined;
  }
  return h('tr', [
    h(
      'th.w-15',
      h('.flex-row', [
        h('.w-75', 'Vars'),
        vars && h('.w-25.text-right.mh2.actionable-icon', {
          onclick: () => {
            environment.isExpanded.vars = !environment.isExpanded.vars;
            environment.notify();
          },
        }, environment.isExpanded.vars ? iconChevronTop() : iconChevronBottom()),
      ]),
    ),
    h(
      'td.flex-row',
      !environment.isExpanded.vars || !vars ?
        h('.mh2.overflow', JSON.stringify(vars))
        : expandedKVPanel(environment, vars),
    ),
  ]);
};

/**
 * Build an html row which can be expanded to view all information about the uservars
 * @param {JSON} userVars
 * @param {Environment} environment
 * @returns {vnode}
 */
const userVarsRow = (userVars, environment) => {
  if (!userVars || Object.keys(userVars).length === 0) {
    userVars = undefined;
  }
  return h('tr', [
    h(
      'th.w-15',
      h('.flex-row', [
        h('.w-75', 'User Vars'),
        userVars && h('.w-25.text-right.mh2.actionable-icon', {
          onclick: () => {
            environment.isExpanded.userVars = !environment.isExpanded.userVars;
            environment.notify();
          },
        }, environment.isExpanded.userVars ? iconChevronTop() : iconChevronBottom()),
      ]),
    ),
    h(
      'td.flex-row',
      !environment.isExpanded.userVars || !userVars ?
        h('.mh2.overflow', JSON.stringify(userVars))
        : expandedUserVarsPanel(environment, userVars),
    ),
  ]);
};

/**
 * Display each KV pair on a new line
 * @param {Environment} environment
 * @param {JSON} kv
 * @returns {vnode}
 */
const expandedKVPanel = (environment, kv) =>
  h('.flex-column.w-100', [
    Object.keys(kv)
      .sort((keyA, keyB) => keyA.toLocaleUpperCase() < keyB.toLocaleUpperCase() ? -1 : 1)
      .map((key) =>
        h('.w-100.flex-row', [
          h('.w-25', key),
          h('.w-75', { style: 'word-break: break-word' }, kv[key]),
        ])),
  ]);

/**
 * Build properties of the userVars each on new line and with known variables
 * custom view
 * @param {Environment} environment
 * @param {JSON} userVars
 * @returns {vnode}
 */
const expandedUserVarsPanel = (environment, userVars) => {
  const knownVarGroups = Object.keys(userVars).filter((key) => environment.isVariableInRadioGroup(key))
    .sort((keyA, keyB) => keyA.toLocaleUpperCase() < keyB.toLocaleUpperCase() ? -1 : 1);
  const uriVarGroups = Object.keys(userVars).filter((key) =>
    environment.isKVPairInConsulUriGroup(key, userVars[key]));
  const unknownVarGroups = Object.keys(userVars).filter((key) =>
    !environment.isVariableInRadioGroup(key) && !environment.isKVPairInConsulUriGroup(key, userVars[key]))
    .sort((keyA, keyB) => keyA.toLocaleUpperCase() < keyB.toLocaleUpperCase() ? -1 : 1);
  return h('.flex-column.w-100', [
    knownVarGroups.map((key) =>
      key !== 'hosts' &&
      h('.flex-row', [
        h('.w-25', `${environment.getVariableDescription(key)}:`),
        h('.w-75.flex-row', [h('label.', userVars[key] === 'true' ? 'ON' : 'OFF')]),
      ])),
    unknownVarGroups.map((key) =>
      h('.w-100.flex-row', [
        h('.w-25', key),
        h('.w-75', {
          style: 'word-break: break-word',
        }, userVars[key]),
      ])),
    uriVarGroups.map((key) =>
      h('.w-100.flex-row', [
        h('.w-25', key),
        h('.w-75', {
          style: 'word-break: break-word',
        }, userVars[key]),
      ])),
  ]);
};

export { userVarsRow, defaultsRow, varsRow };
