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

import { Log } from '@aliceo2/web-ui';

/**
 * Class which deals with setting up intervals for repeated actions
 */
export class IntervalsService {
  /**
   * Constructor for initializing an object which is to register intervals
   * @constructor
   */
  constructor() {
    this._intervals = {};
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/intervals`);
  }

  /**
   * Method to allow other services to register events that should trigger based on an interval rate
   * @param {string} key - under which the callback should be registered so that it can be deregister at a later stage
   * @param {function} callback - function that should be called based on interval rate
   * @param {number} intervalRate = 60 * 1000 - (ms) on how often the cache should be refreshed
   * @returns {void}
   */
  register(key, callback, intervalRate = 60 * 1000) {
    this._intervals[key] = setInterval(callback, intervalRate);
  }

  /**
   * Method to allow services to deregister and clear an interval
   * @param {string} key - key under which the interval was registered
   * @returns {void}
   */
  deregister(key) {
    const intervalToDeregister = this._intervals[key];
    clearInterval(intervalToDeregister);
  }
}
