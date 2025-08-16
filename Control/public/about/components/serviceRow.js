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
 * Builds a line composed of 2 elements: name and value
 * @param {string} name - label that should be displayed
 * @param {string} value - value of the field
 * @returns {vnode} - only if value is !undefined
 */
export const serviceRow = (name, value) => {
  return value && h('.w-100.flex-row', [
    h('h6.w-40.p1', name),
    h('span.w-60.ph1', value)
  ]);
};
