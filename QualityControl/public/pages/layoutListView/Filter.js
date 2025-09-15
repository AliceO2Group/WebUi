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
 * @typedef {object} FilterModel
 * @property {(filter: import("./FilterTypes").Filter) => import("./FilterTypes").Filter} register
 *  - Register a filter object with a unique key.
 * @property {(key: string) => void} unregister - Remove a filter by its key.
 * @property {(key: string) => (import("./FilterTypes").Filter|undefined)} get
 *  - Return the registered filter object for the given key.
 * @property {() => import("./FilterTypes").Filter[]} getAll - Return an array of all registered filters.
 * @property {(key: string, ...args: any[]) => void} setValue - Call the filter's set(args...) method.
 * @property {() => void} resetAll - Call reset() on all filters.
 */

/**
 * create the filtermodel that will store our filters and their states.
 * It also provides functionality to modify its filters and getting data from them.
 * @returns {FilterModel} - created filtermodel.
 */
export function createFilterModel() {
  const filters = new Map(); // key -> filter instance

  /**
   * register a filter object.
   * @param {Filter} filter - Filter object to register.
   * @returns {Filter} - Filter object that was registered.
   */
  function register(filter) {
    if (!filter?.key) {
      throw new Error('Invalid filter');
    }
    if (filters.has(filter.key)) {
      throw new Error(`Filter already registered: ${filter.key}`);
    }
    filters.set(filter.key, filter);
    return filter;
  }

  function unregister(key) {
    const filter = filters.get(key);
    if (!filter) {
      return;
    }
    return filters.delete(key);
  }

  function get(key) {
    return filters.get(key);
  };

  function getAll() {
    return Array.from(filters.values());
  }

  function setValue(key, ...args) {
    const filter = filters.get(key);
    if (!filter) {
      throw new Error(`Unknown filter: ${key}`);
    }
    if (typeof filter.set !== 'function') {
      // not a proper filter, we need the setter.
      throw new Error(`Filter has no set method: ${key}`);
    }
    filter.set(...args);
  }

  function resetAll() {
    for (const filter of filters.values()) {
      try {
        if (typeof filter.reset === 'function') {
          filter.reset();
        }
      } catch (e) {
        // TODO: use the correct logger here, not this one...
        console.error(e);
      }
    }
  }

  return {
    register,
    unregister,
    get,
    getAll,
    setValue,
    resetAll,
  };
}
