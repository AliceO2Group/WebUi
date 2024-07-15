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
 * @class
 * Class which deals with setting up intervals for repeated actions
 */
export class IntervalsService {
  /**
   * Constructor for initializing an object which is to register intervals
   */
  constructor() {
    this._intervals = {};
  }

  /**
   * Method to allow other services to register events that should trigger based on an interval rate
   * @param {Function} callback - function that should be called based on interval rate
   * @param {number} intervalRate = 60 * 1000 - (ms) on how often the callback should be called
   * @returns {symbol} - unique key for registered callback
   */
  register(callback, intervalRate = 60 * 1000) {
    const key = Symbol(Math.random());
    this._intervals[key] = setInterval(callback, intervalRate);
    return key;
  }

  /**
   * Method to allow services to deregister and clear an interval
   * @param {symbol} key - key under which the interval was registered
   * @returns {void}
   */
  deregister(key) {
    const intervalToDeregister = this._intervals[key];
    clearInterval(intervalToDeregister);
  }
}
