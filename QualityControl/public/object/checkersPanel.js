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
 * Build a panel for displaying a checker quality object
 * @param {JSON} checker - Object returned by CCDB
 * @param {string} location - location from where the `draw` method is called; Used for styling
 * @return {vnode}
 */
export default (checker, location) => h('.relative.p2.flex-column.scroll-y', {

}, [
  checkerValue('Checker:', checker.mCheckName, location),
  checkerValue('Detector:', checker.mDetectorName, location),
  checkerValue('Quality Name:', checker.mQuality.mName, location),
  checkerValue('Quality Lv.:', checker.mQuality.mLevel, location),
  checkerValue('Inputs:', checker.mInputs, location),
  checkerValue('User Metadata:', checker.mUserMetadata, location),
]);

/**
 * One row with a label and the value of the checker[label]
 * @param {string} label
 * @param {string} value
 * @param {string} location
 * @return {vnode}
 */
const checkerValue = (label, value, location) => {
  let padding = '';
  if (location === 'objectView' || location === 'treePage') {
    padding = 'p3';
  }

  switch (typeof value) {
    case 'string':
      value = value && value.trim() !== '' ? value : '-';
      break;
    case 'object':
      if (value instanceof Array) {
        const format = [];
        value.forEach((element) => format.push(h('.w-wrapped', element)));
        value = format;
      } else {
        const format = [];
        Object.keys(value).forEach((element) => format.push(h('.w-wrapped', [element, ': ', value[element]])));
        value = format;
      }
      break;
    case 'number':
      value = value = value && value.toString() !== '' ? value : '-';
      break;
    default:
      value = value && JSON.stringify(value).trim() !== '' ? JSON.stringify(value) : '-';
  }

  return h(`.flex-row.${padding}`, [
    h('label.ph2.w-50.w-wrapped.text-right.checker-label', label),
    h('.w-wrapped.w-50.text-left', value)
  ]);
};
