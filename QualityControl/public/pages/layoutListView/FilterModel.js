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

import { Observable } from '/js/src/index.js';

/**
 * Filter model which will store and modify the filters
 * @class FilterModel
 * @augments Observable
 * @import { Filter } from './FilterTypes.js';
 */
export class FilterModel extends Observable {
  constructor() {
    super();
    this._filters = new Map(); // key -> filter instance
  }

  /**
   * register a filter object.
   * @param {Filter} filter - Filter object to register.
   * @returns {Filter} - Filter object that was registered.
   */
  register(filter) {
    if (!filter?.key) {
      throw new Error('Invalid filter');
    }
    if (this.filters.has(filter.key)) {
      throw new Error(`Filter already registered: ${filter.key}`);
    }
    this.filters.set(filter.key, filter);
    this.notify();
    return filter;
  }

  /**
   * Getter
   * @returns {Map<Filter.key, Filter>} filters
   */
  get filters() {
    return this._filters;
  }

  set filters(value) {
    this._filters = value;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * unregisters a specified filter by key.
   * @param {string} key - filter key.
   */
  unregister(key) {
    const filter = this.filters.get(key);
    if (!filter) {
      return;
    }
    const result = this.filters.delete(key);
    this.notify();
    return result;
  }

  /**
   * gets a specified filter object by filter.key
   * @param {string} key - filter key.
   * @returns {Filter} - Filter object
   */
  get(key) {
    return this.filters.get(key);
  }

  /**
   * gets all registered filters
   * @returns {Array<Filter>} - Filter object that was registered.
   */
  getAll() {
    return Array.from(this.filters.values());
  }

  /**
   * set filter by key with specified value('s)
   * @param {string} key - filter key.
   * @param {any[]} args - value('s) to set.
   * @returns {void} - void.
   */
  setValue(key, ...args) {
    const filter = this.filters.get(key);
    if (!filter) {
      throw new Error(`Unknown filter: ${key}`);
    }
    if (typeof filter.set !== 'function') {
      // not a proper filter, we need the setter.
      throw new Error(`Filter has no set method: ${key}`);
    }
    filter.set(...args);
    this.notify();
    return;
  }

  resetAll() {
    for (const filter of this.filters.values()) {
      try {
        if (typeof filter.reset === 'function') {
          filter.reset();
        }
        this.notify();
      } catch (e) {
        // TODO: use the correct logger here, not this one...
        console.error(e);
      }
    }
  }
}
