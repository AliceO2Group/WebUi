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

import { BaseViewModel } from '../../../common/abstracts/BaseViewModel.js';
import { createKeyValueFilter } from '../FilterTypes.js';

/**
 * SearchFilter model to control the search and filter state
 * @import { Filter } from '../FilterTypes.js';
 */
export default class SearchFilterModel extends BaseViewModel {
  constructor() {
    super();

    /**
     * filters storage map
     * @type {Map<string,Filter>}
     */
    this.filters = new Map(); // key -> filter instance
    this.searchInput = '';
    this.register(createKeyValueFilter('objectPath', 'Object path'));
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

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * unregisters a specified filter by key.
   * @param {string} key - filter key.
   */
  unregister(key) {
    const filter = this.get(key);
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
    const filter = this.get(key);
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
    this.allInActive();
    for (const filter of this.filters.values()) {
      if (typeof filter.reset === 'function') {
        filter.reset();
      }
      this.notify();
    }
  }

  allInActive() {
    const activeCount = this.filters.values().filter((filter) => filter.isActive()).toArray().length;
    return activeCount > 0 ? false : true;
  }
}
