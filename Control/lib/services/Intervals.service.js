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

const DEFAULT_INTERVAL_RATE = 60 * 1000;

/**
 * @class
 * Class which deals with setting up intervals for retrieving information constantly
 */
class Intervals {
  /**
   * @constructor
   * Constructor for initializing a list of intervals
   */
  constructor() {
    /**
     * @type {Object<Intervals>}
     */
    this._intervals = {};
  }

  /**
   * Method to allow other services to register events that should trigger based on an interval rate
   * @param {function} callback - function that should be called based on interval rate
   * @param {number} intervalRate = 60 * 1000 - (ms) on how often the callback should be called
   * @return {Symbol} - unique key for registered callback
   */
  register(callback, intervalRate = DEFAULT_INTERVAL_RATE) {
    const key = Symbol(Math.random());
    this._intervals[key] = setInterval(callback, intervalRate);
    return key;
  }

  /**
   * Method to allow services to deregister and clear an interval
   * @param {Symbol} key - key under which the interval was registered
   * @return {void}
   */
  deregister(key) {
    clearInterval(this._intervals[key]);
  }
}

exports.Intervals = Intervals;
