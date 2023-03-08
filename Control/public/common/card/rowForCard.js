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

/**
 * Returns a row to be used for panels
 * @param {string} key - name of the property
 * @param {string} value - value of the property
 * @param {{Array<string>, Array<string>}} [valueClasses] - list of classes as list to be used to customise the values
 * @returns {vnode}
 */
export const rowForCard = (key, value, {keyClasses = [], valueClasses = []} = {}) => h(`.flex-row.justify-between`, [
  h('', {classList: keyClasses.join(' ')}, key),
  h('', {classList: valueClasses.join(' ')}, value)
]);
