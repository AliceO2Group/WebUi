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
import {STORAGE, PREFIX, ROLES} from './../workflow/constants.js';
import {DetectorState} from './../common/enums/DetectorState.enum.js';

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

    this._listRemote = RemoteData.notAsked();
    this.hostsByDetectorRemote = RemoteData.notAsked();
    this._selected = '';

    /**
     * @type {Object<String, Detector>}
     */
    this._availability = {};
  }

  /**
   * Load the selected detector from LocalStorage;
   * Initialize to empty string if the user did not select any
   */
  async init() {
    const stored = this.storage.getLocalItem(STORAGE.DETECTOR);
    this._selected = (stored && stored.SELECTED &&
      (this.model.isAllowed(ROLES.Global) || this.authed.includes(stored.SELECTED))) ? stored.SELECTED : '';
    this.notify();
    this._listRemote = await this.getDetectorsAsRemoteData(this._listRemote, this);
    this.notify();
    if (this._listRemote.isSuccess()) {
      this.hostsByDetectorRemote = await this.getHostsByDetectorsAsRemoteData(
        this.hostsByDetectorRemote, this._listRemote.payload, this
      );
      for (const detector of this._listRemote.payload) {
        this._availability[detector] = {
          pfrAvailability: DetectorState.UNDEFINED,
          sorAvailability: DetectorState.UNDEFINED,
        }
      }
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
    this._listRemote = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/detectors`);
    if (!ok) {
      this._listRemote = RemoteData.failure(result.message);
    } else {
      this._listRemote = RemoteData.success(result.detectors);
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
   * Method to return a RemoteData object containing list of detectors fetched from AliECS
   * @param {boolean} [restrictToUser = true] - if the list should be restricted to user permissions only
   * @returns {RemoteData<Array<String>>}
   */
  getDetectorsAsRemote(restrictToUser = true) {
    if (this._listRemote.isSuccess() && restrictToUser) {
      if (this.isSingleView()) {
        const detectors = this._listRemote.payload.filter((detector) => detector === this._selected);
        return RemoteData.success(detectors);
      }
    }
    return this._listRemote;
  }

  /**
   * Method to return a RemoteData object containing list of detectors fetched from AliECS and their availability
   * @param {boolean} [restrictToUser = true] - if the list should be restricted to user permissions only
   * @param {RemoteData} item - item in which data should be loaded and notified
   * @param {typeof Model} that - model that should be notified after a change in data fetching
   * @returns {RemoteData<Array<DetectorAvailability>>} - returns the state of the detectors
   */
  async getDetectorsAvailabilityAsRemote(restrictToUser = true, item = RemoteData.notAsked(), that = this) {
    item = RemoteData.loading();
    that.notify();

    let {result: {detectors}, ok: detectorsOk} = await this.model.loader.get(`/api/core/detectors`);
    const {
      result: {detectors: activeDetectors},
      ok: detectorsActivityOk
    } = await this.model.loader.post(`/api/GetActiveDetectors`);
    const isLockDataOk = this.model.lock.padlockState.isSuccess();

    if (detectorsOk && detectorsActivityOk && isLockDataOk) {
      const padLock = this.model.lock.padlockState.payload;
      if (restrictToUser && this.isSingleView()) {
        detectors = detectors.filter((detector) => detector === this._selected);
      }
      /**
       * @type {Array<DetectorAvailability>}
       */
      const detectorsAvailability = detectors.map((detector) => ({
        name: detector,
        isActive: activeDetectors.includes(detector),
        isLockedBy: padLock.lockedBy[detector],
      }));
      item = RemoteData.success(detectorsAvailability);
      that.notify();
      return item;
    } else {
      item = RemoteData.failure('Unable to fetch information on detectors state');
      that.notify();
      return item;
    }
  }

  /**
   * Method to return a RemoteData object containing list of detectors fetched from AliECS
   * @deprecated as it should be using `getDetectorsAsRemote` instead
   * @returns {RemoteData<Array<String>>}
   */
  get listRemote() {
    return this._listRemote;
  }

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

  /**
   * Set the new values for DCS's properties availability which are updated via refresh page
   * or websocket messages
   * @param {Object<String, Object>} availability - json with detectors availability
   * @return {void}
   */
  set availability(availability) {
    for (const detector of Object.keys(availability)) {
      this._availability[detector] = {
        pfrAvailability: DetectorState[availability[detector].PfrAvailability] ?? DetectorState.UNDEFINED,
        sorAvailability: DetectorState[availability[detector].SorAvailability] ?? DetectorState.UNDEFINED,
      }
    }
  }

  /**
   * Return an instance of the current detectors availability
   */
  get availability() {
    return this._availability;
  }

  /**
   * Given a list of detectors, return if all are available for specified property (PFR/SOR)
   * @param {Array<String>} detectors - list of detectors to check
   * @param {String['pfrAvailability', 'sorAvailability']} property - which property to be checked
   * @return {Boolean}
   */
  areDetectorsAvailable(detectors, property) {
    const state = property === 'pfrAvailability' ? DetectorState.PFR_AVAILABLE : DetectorState.SOR_AVAILABLE;
    return detectors.every((detector) => this._availability?.[detector]?.[property] === state);
  }
}
