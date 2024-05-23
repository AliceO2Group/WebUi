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

const {DetectorLock} = require('./../dtos/DetectorLock.js');
const {User} = require('./../dtos/User.js');
const {UnauthorizedAccessError} = require('./../errors/UnauthorizedAccessError');

const PADLOCK_UPDATE = 'padlock-update';

/**
 * @class
 * LockService class to be used for retrieving and updating state of detector locks to control hardware components via AliECS:
 * * take/release lock/all-locks as normal role
 * * force take/release lock/all-locks as administrator
 */
class LockService {
  /**
   * @constructor
   * Constructor for configuring the initial state of stored information
   * @param {BroadcastService} broadcastService - service to use to broadcast lock state changes
   */
  constructor(broadcastService) {
    /**
     * @type {BroadcastService}
     */
    this._broadcastService = broadcastService;

    /**
     * @type {Object<String, DetectorLock>}
     */
    this._locksByDetector = {};
  }

  /**
   * Initialize Lock service based on the provided list of detectors
   * @param {Array<String>} detectors = [] - list of detectors to be used for the lock mechanism
   * @return {void}
   */
  setLockStatesForDetectors(detectors = []) {
    for (const detectorName of detectors) {
      this._locksByDetector[detectorName] = new DetectorLock(detectorName);
    }
  }

  /**
   * Return the states of all detector locks currently used by the system grouped by the detector name
   * @returns {Object<String, DetectorLock>}
   */
  get locksByDetector() {
    return this._locksByDetector;
  }

  /** 
   * Method to try to acquire lock for a specified detector by a user
   * @param {String} detectorName - detector as defined by AliECS
   * @param {User} user - user trying to acquiring the lock
   * @param {Boolean} shouldForce - specified if lock should be taken even if held by another user
   * 
   * @return {Object<String, DetectorLock>} - updated state of all detector locks
   * @throws {UnauthorizedAccessError}
   */
  takeLock(detectorName, user, shouldForce = false) {
    const lock = this._locksByDetector[detectorName];

    if (lock.isTaken()) {
      if (!lock.isOwnedBy(user) && !shouldForce) {
        throw new UnauthorizedAccessError(
          `Unauthorized TAKE action for lock of detector ${detectorName} by user ${lock.owner.username}`
        );
      }
      if (lock.isOwnedBy(user)) {
        return this._locksByDetector;
      }
    }
    this._locksByDetector[detectorName].assignOwner(user);

    this._broadcastService.broadcast(PADLOCK_UPDATE, this._locksByDetector);
    return this._locksByDetector;
  }

  /** 
   * Method to try to release lock for a specified detector by a user
   * @param {String} detectorName - detector name as defined by AliECS
   * @param {User} user - user that wishes to release the lock
   * @param {Boolean} shouldForce - lock should be taken even if held by another user
   * 
   * @return {Object<String, DetectorLock>}
   * @throws {UnauthorizedAccessError}
   */
  releaseLock(detectorName, user, shouldForce = false) {
    const lock = this._locksByDetector[detectorName]
    if (lock.isFree()) {
      return this._locksByDetector;
    }
    if (!lock.isOwnedBy(user) && !shouldForce) {
      throw new UnauthorizedAccessError(
        `Unauthorized RELEASE action for lock of detector ${detectorName} by user ${lock.owner.username}`
      );
    }
    this._locksByDetector[detectorName].release();

    this._broadcastService.broadcast(PADLOCK_UPDATE, this._locksByDetector);
    return this._locksByDetector;
  }

  /**
   * 
   * TODO
   * Checks if the given user has the lock for the provided list of detectors
   * @param {String} userName - of user to check lock ownership
   * @param {Number} userId - person id of the user
   * @param {Array<string>} detectors - list of detectors to check lock is owned by the user
   * @returns {boolean}
   */
  hasLocks(userName, userId, detectors) {
    return detectors.every((detector) => this._locksByDetector[detector].isOwnedBy(new User(userName, userId)));
  }
}

exports.LockService = LockService;
