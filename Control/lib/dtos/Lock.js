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
'use strict';

import {LockState} from "../common/lock/lockState.enum.js";

/**
 * Lock representation as used for ECS GUI purposes
 */
export class Lock {
  /**
   * Initializing a lock with a free state
   * @param {String} name - name of the detector
   */
  constructor(name) {

    /**
     * @type {String}
     */
    this._name = name;

    /**
     * @type {LockState}
     */
    this._state = LockState.FREE;

    /**
     * @type {User}
     */
    this._user = undefined;
  }

  /**
   * Method to assign a user to a lock
   * @param {User} - user that is to take the lock
   * @return {void}
   */
  assignUser(user) {
    this._state = LockState.TAKEN
    this._user = user;
  }

  /**
   * Method to allow the removal of a user of a lock
   * @return {void}
   */
  removeUser() {
    this._state = LockState.FREE;
    this._user = undefined;
  }

  /**
   * Given a user, check if the lock is currently assigned by the respective user
   * @param {User} user - to check ownership of
   * @return {Boolean}
   */
  isAssignedToUser(user) {
    return this._user.isSameUser(user);
  }

  /**
   * Return a user object currently owning the lock
   * @return {User}
   */
  get user() {
    return this._user;
  }

  /**
   * Return the current state of the lock
   * @return {LockState}
   */
  get state() {
    return this._state;
  }
}
