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
import {STORAGE, PREFIX} from './../workflow/constants.js';

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
    this.authed = this.model.session.access
      .filter((role) => role.startsWith(PREFIX.SSO_DET_ROLE))
      .map((role) => role.replace(PREFIX.SSO_DET_ROLE, '').toUpperCase());
    this.storage = new BrowserStorage(`COG-${this.model.router.location.hostname}`);
    this.listRemote = RemoteData.notAsked();
    this.hostsByDetectorRemote = RemoteData.notAsked();
    this._selected = '';
  }

  /**
   * Load the selected detector from LocalStorage;
   * Initialize to empty string if the user did not select any
   */
  async init() {
    const stored = this.storage.getLocalItem(STORAGE.DETECTOR);
    this._selected = (stored && stored.SELECTED &&
      (this.model.isAllowed(this.model.Roles.Global) || this.authed.includes(stored.SELECTED))) ? stored.SELECTED : '';
    this.notify();
    this.listRemote = await this.getDetectorsAsRemoteData(this.listRemote, this);
    this.notify();
    if (this.listRemote.isSuccess()) {
      this.hostsByDetectorRemote = await this.getHostsByDetectorsAsRemoteData(
        this.hostsByDetectorRemote, this.listRemote.payload, this
      );
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
   * Given a list of detectors, make a request to get all the hosts
   * belonging to each detector;
   * Returns a RemoteData which if successful contains a map<String,JSON>
   * @param {RemoteData} item
   * @param {Object} that
   * @returns {RemoteData}
   */
  async getHostsByDetectorsAsRemoteData(item, detectors, that) {
    item = RemoteData.loading();
    that.notify();
    const {ok, result} = await this.model.loader.get(`/api/core/hostsByDetectors`);
    item = ok ?
      RemoteData.success(result.hosts) : RemoteData.failure({message: 'Unable to load list of hosts by detectors'});
    that.notify();
    return item;
  }

  /**
   * Fetch detectors and return it as a remoteData object
   * @param {RemoteData} item
   */
  async getDetectorsAsRemoteData(item, that) {
    item = RemoteData.loading();
    that.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/detectors`);
    if (!ok) {
      item = RemoteData.failure(result.message);
    } else {
      item = RemoteData.success(result.detectors);
    }
    that.notify();
    return item;
  }

  /**
   * Fetch detectors and return it as a remoteData object
   * @param {RemoteData} item
   */
  async getAndSetDetectorsAsRemoteData() {
    this.listRemote = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/detectors`);
    if (!ok) {
      this.listRemote = RemoteData.failure(result.message);
    } else {
      this.listRemote = RemoteData.success(result.detectors);
    }
    this.notify();
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
   * @return {RemoteData}
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
