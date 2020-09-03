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

/* global: window */

/**
 * Interface to be used for local & session storage
 * @example
 * import {BrowserStorage} from '/js/src/index.js';
 * const storage = new BrowserStorage();
 * storage.setLocalItem('key', {value: 'value'});
 * storage.clearLocalStorage();
 */
export default class BrowserStorage {
  /**
   * Creates a BrowserStorage instance which uses `label` as a prefix for all keys
   * @param {string} label
   */
  constructor(label) {
    this.label = label;
    this.localStorage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
  }

  /**
   * Method to remove item by key from `localStorage`
   * @param {string} key
   */
  removeLocalItem(key) {
    if (this._isParameterValid(key)) {
      this.localStorage.removeItem(`${this.label}-${key}`);
    }
  }

  /**
   * Method to remove item by key from `sessionStorage`
   * @param {string} key
   */
  removeSessionItem(key) {
    if (this._isParameterValid(key)) {
      this.sessionStorage.removeItem(`${this.label}-${key}`);
    }
  }

  /**
  * Method to clear `localStorage`
  */
  clearLocalStorage() {
    this.localStorage.clear();
  }

  /**
   * Method to clear `sessionStorage`
   */
  clearSessionStorage() {
    this.sessionStorage.clear();
  }

  /**
   * Method to return the value as JSON from `localStorage` based on key
   * Returns `null` if not found
   * @param {string} key
   * @return {boolean}
   */
  getLocalItem(key) {
    return this._getItemAsJSON(key, 'localStorage');
  }

  /**
   * Method to return the value as JSON from `sessionStorage` based on key
   * Returns `null` if not found
   * @param {string} key
   * @return {boolean}
   */
  getSessionItem(key) {
    return this._getItemAsJSON(key, 'sessionStorage');
  }

  /**
   * Method to return the value as JSON from storage based on key
   * Returns `null` if not found
   * @param {string} key
   * @param {string} locationLabel
   * @return {boolean}
   */
  _getItemAsJSON(key, locationLabel) {
    if (this._isParameterValid(key)) {
      switch (locationLabel) {
        case 'localStorage':
          return JSON.parse(this.localStorage.getItem(`${this.label}-${key}`));
        case 'sessionStorage':
          return JSON.parse(this.sessionStorage.getItem(`${this.label}-${key}`));
      }
    } else {
      return null;
    }
  }

  /**
   * Method to set (key, value) in `sessionStorage`.
   * Returns boolean if successful or not
   * @param {string} key
   * @param {object} value
   * @return {boolean}
   */
  setSessionItem(key, value) {
    return this._setItem(key, value, 'sessionStorage');
  }

  /**
   * Method to set (key, value) in `localStorage`.
   * Returns boolean if successful or not
   * @param {string} key
   * @param {object} value
   * @return {boolean}
   */
  setLocalItem(key, value) {
    return this._setItem(key, value, 'localStorage');
  }

  /**
   * Method to set item in browser storage.
   * Returns boolean if successful or not
   * @param {string} key
   * @param {Object} value
   * @param {string} locationLabel
   * @return {boolean}
   */
  _setItem(key, value, locationLabel) {
    const valueAsString = JSON.stringify(value);
    if (this._isParameterValid(key) && this._isParameterValid(valueAsString)) {
      switch (locationLabel) {
        case 'localStorage':
          this.localStorage.setItem(`${this.label}-${key}`, valueAsString);
          break;
        case 'sessionStorage':
          this.sessionStorage.setItem(`${this.label}-${key}`, valueAsString);
          break;
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Method to check if a passed value is of type string and contains non-white characters.
   * @param {string} parameter
   * @return {boolean}
   */
  _isParameterValid(parameter) {
    if (!parameter || typeof parameter !== 'string' || parameter.trim().length === 0) {
      return false;
    }
    return true;
  }
}
