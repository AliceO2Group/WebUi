/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

/**
 * Functional switch case
 * @param {string} caseName
 * @param {Object.<string,Any>} cases
 * @param {Any} defaultCaseValue
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
  cases.hasOwnProperty(caseName) ? cases[caseName] : defaultCaseValue;

export default switchCase;
