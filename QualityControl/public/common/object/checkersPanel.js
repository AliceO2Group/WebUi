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
 * Build a panel for displaying a checker quality object
 * @param {JSON} checker - Object returned by CCDB
 * @returns {vnode} - virtual node element
 */
export default (checker) => h('.relative.p2.flex-column.scroll-y.g4', {

}, [
  checkerValue('Checker:', checker.mCheckName),
  checkerValue('Detector:', checker.mDetectorName),
  checkerValue('Quality Name:', checker.mQuality?.mName),
  checkerValue('Quality Lv.:', checker.mQuality?.mLevel),
  checkerValue('Inputs:', checker.mInputs),
  checkerValue('User Metadata:', checker.mQuality?.mUserMetadata),
]);

/**
 * One row with a label and the value of the checker[label]
 * @param {string} label - label to be displayed for the checker
 * @param {string} value - value of the checker
 * @returns {vnode} - virtual node element
 */
const checkerValue = (label, value) => {
  if (value === null || value === undefined) {
    value = {};
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

  return h('.flex-row', [
    h('label.ph2.w-50.w-wrapped.text-right.checker-label', label),
    h('.w-wrapped.w-50.text-left', value),
  ]);
};
