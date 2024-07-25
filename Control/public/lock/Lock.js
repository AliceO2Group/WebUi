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

import { DetectorLockState } from './../common/enums/DetectorLockState.enum.js';
import { di } from './../utilities/di.js';
import { jsonPut } from './../utilities/jsonPut.js';
import { Observable, RemoteData } from '/js/src/index.js';

/**
 * Model for the detector locks that control which user is allowed to control environments for AliECS
 */
export default class Lock extends Observable {
  /**
   * Initialize lock state to NotAsked
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;

    /**
     * RemoteData object to maintain a state of the detector locks
     * @type {Object<String, DetectorLock>
     */
    this._padlockState = RemoteData.notAsked();
  }

  /**
   * Get the full name of the current lock owner or null if the lock is not taken
   * @param {string} detector - detector for which to get the owner
   * @returns {string} - name and surname of the owner
   */
  getOwnerFullName(detector) {
    if (this.isLocked(detector)) {
      return this._padlockState.payload?.[detector]?.owner?.fullName;
    } else {
      return '';
    }
  }

  /**
   * Return a boolean indicating whether the lock is taken or not
   * @param {string} detector - detector name for which to check state
   * @returns {bool}
   */
  isLocked(detector) {
    return this._padlockState.isSuccess() &&
      this._padlockState.payload?.[detector]?.state === DetectorLockState.TAKEN;
  }

  /**
   * States whether given lock is locked by current user
   * @param {string} name Lock name/entity
   * @param detector
   * @returns {bool}
   */
  isLockedByCurrentUser(detector) {
    return this.isLocked(detector) &&
      di.session.personid === this._padlockState.payload?.[detector]?.owner?.personid;
  }

  /**
   * Load Padlock state from server
   */
  async synchronizeState() {
    this._padlockState = RemoteData.loading();
    this.notify();

    const { result, ok } = await this.model.loader.get('/api/locks');
    if (!ok) {
      this._padlockState = RemoteData.failure(result.message);
      this.notify();
      this.model.notification.show('Fatal error while loading LOCK, please try to reload the page', 'danger', Infinity);
      return;
    }
    this._padlockState = RemoteData.success(result);
    this.notify();
  }

  /**
   * Service method to request an action on a lock for a given detector.
   * @param {string} detector - name of the lock to act on
   * @param {DetectorLockAction} action - action to take on the lock
   * @param {boolean} [shouldForce = false] - whether to force the action
   * @returns {Promise<void>}
   */
  async actionOnLock(detector, action, shouldForce = false) {
    const path = shouldForce ? `/api/locks/force/${action}/${detector}` : `/api/locks/${action}/${detector}`;
    try {
      const result = await jsonPut(path);
      this._padlockState = RemoteData.success(result);
      this.notify();
    } catch (error) {
      this.model.notification.show(error.message, 'danger');
    }
  }

  /**
   * Getters & Setters
   */

  /**
   * Set padlock state from ajax or websocket as a RemoteData
   * @param {Object<string, DetectorLock>} detectorsLocksState - object representing PadLock from server
   */
  set padlockState(detectorsLocksState) {
    this._padlockState = RemoteData.success(detectorsLocksState);
    this.notify();
  }

  /**
   * Get the padlock state
   * @returns {RemoteData<Object<string, DetectorLock>>}
   */
  get padlockState() {
    return this._padlockState;
  }
}
