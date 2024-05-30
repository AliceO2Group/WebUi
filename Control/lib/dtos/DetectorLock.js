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

const {DetectorLockState} = require('../common/lock/detectorLockState.enum.js');

/**
 * DetectorLock representation as used for ECS GUI purposes
 */
class DetectorLock {
  /**
   * Initializing a lock with a free state
   * @param {String} name - name of the detector
   */
  constructor(name) {

    /**
     * Name of the detector the lock represents
     * @type {String}
     */
    this._name = name;

    /**
     * @type {LockState}
     */
    this._state = DetectorLockState.FREE;

    /**
     * @type {User}
     */
    this._owner = undefined;
  }

  /**
   * Method to assign a user to a lock
   * @param {User} - user that is to own the lock
   * @return {void}
   */
  assignOwner(user) {
    this._state = DetectorLockState.TAKEN
    this._owner = user;
  }

  /**
   * Method to allow the removal of a user of a lock
   * @return {void}
   */
  release() {
    this._state = DetectorLockState.FREE;
    this._owner = undefined;
  }

  /**
   * Given a user, check if the lock is currently assigned by the respective user
   * @param {User} user - to check ownership of
   * @return {Boolean}
   */
  isOwnedBy(user) {
    return this._owner.isSameUser(user);
  }

  /**
   * Method to return if the lock is currently taken
   * @return {Boolean} - if state of detector lock is taken
   */
  isTaken() {
    return this._state === DetectorLockState.TAKEN;
  }

  /**
   * Method to return if the lock is currently free
   * @return {Boolean} - if state of detector lock is free
   */
  isFree() {
    return this._state === DetectorLockState.FREE;
  }

  /**
   * Return a user object currently owning the lock
   * @return {User}
   */
  get owner() {
    return this._owner;
  }

  /**
   * Return a JSON representation of the lock that is to be passed via HTTP
   * @return {JSON{DetectorLock}}
   */
  toJSON() {
    return {
      name: this._name,
      state: this._state,
      owner: this._owner?.toJSON(),
    }
  }
}

exports.DetectorLock = DetectorLock;
