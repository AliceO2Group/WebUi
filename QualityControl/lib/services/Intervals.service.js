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
 * Class which deals with setting up intervals for retrieving information constantly
 */
export class Intervals {
  /**
   * Expected services to be used to retrieve information
   * @constructor
   * @param {QcObjectService} qcObjectService - data service for retrieving qc objects information
   */
  constructor(qcObjectService) {
    this._qcObjectService = qcObjectService;
    this._intervals = [];
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/intervals`);
  }

  /**
   * Method to initialize all intervals used by AlIECS GUI to acquire data
   * @returns {void}
   */
  initializeIntervals() {
    this._initializeQcObjectInterval(this._qcObjectService.getCacheRefresh());
  }

  /**
   * Setup initial request of data and interval for retrieving and updating cache of objects paths from CCDB
   * @param {number} cacheRefresh - (ms) on how often the cache should be refreshed
   * @returns {void}
   */
  _initializeQcObjectInterval(cacheRefresh = 60 * 1000) {
    this._logger.debug('Cache - objects - has been initialized');
    this._qcObjectService.refreshCache();
    this._intervals.push(setInterval(() => this._qcObjectService.refreshCache(), cacheRefresh));
  }
}
