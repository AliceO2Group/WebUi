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

/*
 *Javascript is weakly-typed.
 *Properties of an object can be checked
 */

/**
 * Checks type of passed argument
 * @param {Array.<Layout>} array - list of layouts to be asserted
 * @returns {boolean} true is correct
 */
export function assertLayouts(array) {
  assertArray(array);
  array.forEach((item) => assertLayout(item));
  return array;
}

/**
 * Checks type of passed argument
 * @param {Layout} obj - layout dto representation
 * @returns {boolean} true is correct
 */
export function assertLayout(obj) {
  assertString(obj.id);
  assertString(obj.name);
  assertNumber(obj.owner_id);
  assertString(obj.owner_name);
  assertArray(obj.tabs);
  return obj;
}

/**
 * Checks type of passed argument
 * @param {Array.<Tab>} array - list of tabs to be asserted
 * @returns {boolean} true is correct
 */
export function assertTabs(array) {
  assertArray(array);
  array.forEach((item) => assertTab(item));
  return array;
}

/**
 * Checks type of passed argument
 * @param {Tab} obj - tab dto to be asserted
 * @returns {boolean} true is correct
 */
export function assertTab(obj) {
  assertString(obj.id);
  assertString(obj.name);
  assertArray(obj.objects);
  return obj;
}

/**
 * Checks type of passed argument
 * @param {TabObject} obj - tab element to be asserted
 * @returns {boolean} true is correct
 */
export function assertTabObject(obj) {
  assertString(obj.id);
  assertString(obj.name);
  assertArray(obj.options);
  assertNumber(obj.x);
  assertNumber(obj.y);
  assertNumber(obj.h);
  assertNumber(obj.w);
  return obj;
}

// Primive types

/**
 * Checks type of passed argument
 * @param {number} value - value to be asserted as number
 * @returns {boolean} true is correct
 */
export function assertNumber(value) {
  if (typeof value !== 'number') {
    throw new TypeError(`value must be a number, found ${typeof value}`);
  }
  return value;
}

/**
 * Checks type of passed argument
 * @param {string} value - value to be asserted as string
 * @returns {boolean} true is correct
 */
export function assertString(value) {
  if (typeof value !== 'string') {
    throw new TypeError(`value must be a string, found ${typeof value}`);
  }
  return value;
}

/**
 * Checks type of passed argument
 * @param {array} value - to be asserted as array
 * @returns {boolean} true is correct
 */
export function assertArray(value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`value must be an array, found ${typeof value}`);
  }
  return value;
}
