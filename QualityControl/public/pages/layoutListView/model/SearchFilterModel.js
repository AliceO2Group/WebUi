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

/**
 * SearchFilter model to control the search and filter state
 * @import { Filter } from '../FilterTypes.js';
 */
export class SearchFilterModel extends BaseViewModel {
  constructor() {
    super();

    /**
     * Filters storage map
     * @type {Map<string,Filter>}
     */
    this.filters = new Map(); // key -> filter instance
    this.searchInput = '';
  }

  /**
   * Register a filter object.
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
   * Unregisters a specified filter by key.
   * @param {string} key - filter key.
   * @returns {void|boolean} void when key is not registered or true when the filter was successfully unregistered.
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
   * Gets a specified filter object by filter.key
   * @param {string} key - filter key.
   * @returns {Filter} - Filter object
   */
  get(key) {
    return this.filters.get(key);
  }

  /**
   * Gets all registered filters
   * @returns {Array<Filter>} - Filter object that was registered.
   */
  getAll() {
    return Array.from(this.filters.values());
  }

  /**
   * Set filter by key with specified value('s)
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
    if (this.allInactive()) {
      return;
    } else {
      for (const filter of this.filters.values()) {
        if (typeof filter.reset === 'function') {
          filter.reset();
        }
      }
      this.notify();
    }
  }

  /**
   * Get all the currently active filters.
   * @returns {Array<Filter>} all active filters
   */
  getAllActive() {
    return [...this.filters.values()].filter((f) => f.isActive());
  }

  /**
   * check if all filters are inactive or not.
   * @returns {boolean} all filters are inactive
   */
  allInactive() {
    const activeCount = this.getAllActive().length;
    return activeCount > 0 ? false : true;
  }

  /**
   * Returns all active filters in a object like so
   * This is the object that we can actually search with.
   * {
   *    objectPath: 'TPC',
   *    pizza: 'Peperoni',
   * }
   * @returns {object} object containing all key/value pairs from all active filters.
   */
  getAllActiveAsObject() {
    return Object.fromEntries(this.getAllActive().map((filter) => [filter.key, filter.getValue()]));
  }

  /**
   * Return the active filters in a representable way.
   * @returns {string} Active filters: filter.friendlyName(), ... .
   */
  stringifyActiveFiltersFriendly() {
    let activeFilterText = 'Active filters: ';
    if (this.allInactive()) {
      activeFilterText = '';
      return activeFilterText;
    } else {
      const activeNames = this.getAllActive().map((filter) => filter.friendlyName());
      activeFilterText += `${activeNames.join(', ')}.`;

      return activeFilterText;
    }
  }
}
