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

import {Observable, RemoteData, BrowserStorage} from '/js/src/index.js';
import {STORAGE} from './../workflow/constants.js';

/**
 * Model representing API Calls regarding Detectors
 */
export default class DetectorService extends Observable {
  /**
   * Initialize service with model object
   * @param {Observable} model
   */
  constructor(model) {
    super();
    this.model = model;
    this.storage = new BrowserStorage(`COG-${this.model.router.location.hostname}`);

    this.listRemote = RemoteData.notAsked();
    this._selected = '';
  }

  /**
   * Load the selected detector from LocalStorage;
   * Initialize to empty string if the user did not select any
   */
  async init() {
    const stored = this.storage.getLocalItem(STORAGE.DETECTOR);
    if (stored && stored.SELECTED) {
      this._selected = stored.SELECTED;
    } else {
      this._selected = '';
      this.listRemote = await this.getDetectorsAsRemoteData(this.listRemote);
    }
    this.notify();
  }

  /**
   * Checks if the detector view is single and not global
   * @returns {boolean}
   */
  isSingleView() {
    return this._selected && this._selected !== 'GLOBAL';
  }

  /**
   * Update selection for detector view in LocalStorage
   * Format: {SELECTED: <string>}
   * @param {Array<String>} detector
   */
  saveSelection(detector) {
    this._selected = detector;
    this.storage.setLocalItem(STORAGE.DETECTOR, {SELECTED: detector});
    this.notify();
  }

  /**
   * HTTP Calls
   */

  /**
   * Fetch detectors and return it as a remoteData object
   * @param {RemoteData} item
   */
  async getDetectorsAsRemoteData(item) {
    item = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/ListDetectors`);
    if (!ok) {
      item = RemoteData.failure(result.message);
    } else {
      item = RemoteData.success(result.detectors);
    }
    this.notify();
    return item;
  }

  /**
   * Fetch detectors and return it as a remoteData object
   * @param {RemoteData} item
   */
  async getActiveDetectorsAsRemoteData(item) {
    item = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetActiveDetectors`);
    if (!ok) {
      item = RemoteData.failure(result.message);
    } else {
      item = RemoteData.success(result.detectors);
    }
    this.notify();
    return item;
  }

  /**
   * Given a detector, it will return a RemoteData objects containing the result of query 'GetHostInventory'
   * @param {String} detector 
   */
  async getHostsForDetector(detector, item, that) {
    item = RemoteData.loading();
    that.notify();
    const {result, ok} = await this.model.loader.post(`/api/GetHostInventory`, {detector});
    if (!ok) {
      item = RemoteData.failure(result.message);
    } else {
      item = RemoteData.success(result.hosts);
    }
    that.notify();
    return item;
  }

  /**
   * Getters & Setters
   */

  /**
   * Return selected detectors
   * @return {String}
   */
  get selected() {
    return this._selected;
  }

  /**
   * Set the selected detectors
   * @param {String}
   */
  set selected(detector) {
    this._selected = detector;
  }
}
