
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
 * Retrieve and parse a value from localStorage or sessionStorage.
 *
 * @param {string} key - The storage key to read.
 * @param {'local'|'session'} [storage='local'] - 'local' uses localStorage, 'session' uses sessionStorage.
 * @returns {any|null} The parsed JSON value, or null if the key is not present or the stored value is empty.
 *
 */
export function getStorageItem(key: string, storage: 'local' | 'session' = 'local') {
  const store = storage === 'local' ? localStorage : sessionStorage;
  const item = store.getItem(key);
  if (item === undefined) { // Parsing undefined throws an error
    return null;
  }
  return item ? JSON.parse(item) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Storable = number | string | object | any[];

/**
 * Serialize and save a value to localStorage or sessionStorage.
 *
 * @param {string} key - The storage key under which to save the value.
 * @param {number|string|object|any[]} value - The value to be serialized with JSON.stringify.
 * @param {'local'|'session'} [storage='local'] - 'local' uses localStorage, 'session' uses sessionStorage.
 * @returns {number|string|object|any[]} The same value that was passed in.
 *
 */
export function setStorageItem(key: string, value: Storable, storage: 'local' | 'session' = 'local') {
  const store = storage === 'local' ? localStorage : sessionStorage;
  store.setItem(key, JSON.stringify(value));
  return value;
}
