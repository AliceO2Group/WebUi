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

import {Observable, RemoteData} from '/js/src/index.js';
import {jsonPut} from './../utilities/jsonPut.js';

/**
 * Shadow model of Padlock, synchronize with the web server which contains the real one
 */
export default class Lock extends Observable {
  /**
   * Initialize lock state to NotAsked
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.padlockState = RemoteData.notAsked(); // {lockedBy, lockedByName}
  }

  /**
   * Provides name and surname of lock holder
   * @param {string} name Lock name/entity
   * @returns {string} Name and surname as provided from SSO
   */
  getOwner(name) {
    if (this.padlockState.kind === 'Success' &&
      this.padlockState.payload.lockedBy &&
      name in this.padlockState.payload.lockedByName) {
      return this.padlockState.payload.lockedByName[name];
    } else {
      return '';
    }
  }

  /**
   * State whether given lock is in locked state
   * @param {string} name Lock name/entity
   * @returns {bool}
   */
  isLocked(name) {
    return this.padlockState.kind === 'Success' &&
      this.padlockState.payload.lockedBy &&
      name in this.padlockState.payload.lockedBy;
  }

  /**
   * States whether given lock is locked by current user
   * @param {string} name Lock name/entity
   * @returns {bool}
   */
  isLockedByMe(name) {
    return this.isLocked(name) &&
      this.model.session.personid === this.padlockState.payload.lockedBy[name];
  }
  /**
   * Set padlock state from ajax or websocket as a RemoteData
   * @param {string} padlockState - object representing PadLock from server
   */
  setPadlockState(padlockState) {
    this.padlockState = RemoteData.success(padlockState);
    this.notify();
  }

  /**
   * Load Padlock state from server
   */
  async synchronizeState() {
    this.padlockState = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/locks`);
    if (!ok) {
      this.padlockState = RemoteData.failure(result.message);
      this.notify();
      this.model.notification.show('Fatal error while loading LOCK, please reload the page', 'danger', Infinity);
      return;
    }
    this.padlockState = RemoteData.success(result);
    this.notify();
  }

  /**
   * Ask server to get the lock of Control
   * Result of this action will be an update by WS
   */
  async lock(entity) {
    try {
      const result = await jsonPut(`/api/locks/take/${entity}`);
      this.padlockState = RemoteData.success(result);
      this.model.notification.show(`Lock ${entity} taken`, 'success', 1500);
    } catch (error) {
      this.model.notification.show(error, 'danger');
    }
  }

  /**
   * Force Control lock (eg. if someone left the lock in locked state), an administrator can release the lock
   */
  async forceRelease(entity) {
    try {
      const result = await jsonPut(`/api/locks/release/${entity}/true`);
      this.padlockState = RemoteData.success(result);
      this.model.notification.show(`Lock ${entity} forcefully released`, 'success', 1500);
    } catch (error) {
      this.model.notification.show(error, 'danger');
    }
  }

  /**
   * Ask server to release the lock of Control
   * Result of this action will be an update by WS
   */
  async unlock(entity) {
    try {
      const result = await jsonPut(`/api/locks/release/${entity}`);
      this.padlockState = RemoteData.success(result);
      this.model.notification.show(`Lock ${entity} released`, 'success', 1500);
    } catch (error) {
      this.model.notification.show(error, 'danger');
    }
  }
}
