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
 * @typedef {object} Filter
 * @property {string} key - searchable key of the filter.
 * @property {Function} isActive - has the filter any active value('s)
 * @property {Function} getValue - gets the current value('s) of the filter
 * @property {Function} set - set value of the filter
 * @property {Function} reset - reset filter to default state
 */

/**
 * creates a key-value filter.
 * @param {string} key - key used to save and retrieve value.
 * @param {string} value - value associated with key.
 * @returns {Filter} key-value filter object.
 */
export function createKeyValueFilter(key, value = '') {
  return {
    key,
    getValue: () => value ? value : null,
    // trim checks if value is a string value, test this
    isActive: () => Boolean(value && value.trim()),
    set: (v) => {
      value = v;
    },
    reset: () => {
      value = '';
    },
  };
}

// Multi-value filter
/**
 * Creates a multiple value filter, key with array value.
 * @param {string} key - key used to save and retrieve value.
 * @param {Array<string>} value - values (array) associated with key.
 * @returns {Filter} multiple value filter, key with array with values.
 */
export function createMultiValueFilter(key, value = []) {
  let values = Array.isArray(value) ? value : [];
  return {
    key,
    getValue: () => values,
    isActive: () => values.length > 0,
    add: (v) => {
      if (!values.includes(v)) {
        values.push(v);
      }
    },
    remove: (v) => {
      values = values.filter((x) => x !== v);
    },
    set: (arr) => {
      values = Array.isArray(arr) ? arr : [];
    },
    reset: () => {
      values = [];
    },
  };
}
