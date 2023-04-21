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
 * or submit itself to any jurisdiction.p
 */

import { h } from '/js/src/index.js';
import { prettyFormatDate } from './../utils.js';

const DATE_FIELDS = ['validFrom', 'validUntil', 'createdAt', 'lastModified'];
const TO_REMOVE_FIELDS = ['qcObject', 'timestamps', 'name', 'location'];

/**
 * Builds a panel with information of the object; Fields are parsed according to their category
 * @param {QCObjectDTO} qcObject - QC object with its associated details
 * @param {object} style - properties of the vnode
 * @returns {vnode} - panel with information about the object
 */
export const qcObjectInfoPanel = (qcObject, style = {}) =>
  h('.flex-column.scroll-y', { style }, [
    Object.keys(qcObject)
      .filter((key) => !TO_REMOVE_FIELDS.includes(key))
      .map((key) => infoRow(key, qcObject[key])),
  ]);

/**
 * Builds a raw with the key and value information parsed based on their type
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @returns {vnode} - row with object information key and value
 */
const infoRow = (key, value) => h('.flex-row.g2', [
  h('b.w-25.w-wrapped', key),
  h('.w-75', infoPretty(key, value)),
]);

/**
 * Parses the value and returns it in a specific format based on type
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @returns {vnode} - value of object based on its type
 */
const infoPretty = (key, value) => {
  if (DATE_FIELDS.includes(key)) {
    return prettyFormatDate(value);
  } else if (Array.isArray(value)) {
    return value.length > 0
      ? value.join(', ')
      : '-';
  }
  return h('', value);
};
