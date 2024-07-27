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

/**
 * Functional switch case
 * @param {string} caseName - the caseName to be compared
 * @param {Object.<string,Any>} cases - the cases to be compared
 * @param {Any} defaultCaseValue - the default caseValue
 * @return {Any} the corresponding caseValue of the caseName
 * @example
 * import {h, switchCase} from '/js/src/index.js';
 * default export (model) => h('div', [
 *   h('h1', 'Hello'),
 *   switchCase(model.page, {
 *     list: () => h('p', 'print list'),
 *     item: () => h('p', 'print item'),
 *     form: () => h('p', 'print form'),
 *   }, h('p', 'print default'))();
 * ]);
 */
const switchCase = (caseName, cases, defaultCaseValue) =>
  cases[caseName] ? cases[caseName] : defaultCaseValue;

export default switchCase;
