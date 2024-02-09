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

const {Log} = require('@aliceo2/web-ui');

const {LockState} = require('./../common/lock/lockState.enum.js');
const {Lock} = require('./../dtos/Lock.js');
const {UnauthorizedAccessError} = require('./../errors/UnauthorizedAccessError');

const PADLOCK_UPDATE = 'padlock-update';

/**
 * @class
 * LockService class to be used for retrieving and updating state of locks to control hardware components via AliECS:
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
     * @type {Object<String, Lock>}
     */
    this._locksByDetector = {};

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/lock-service`);
  }

  /**
   * Initialize Lock service based on the provided list of detectors
   * @param {Array<String>} detectors - list of detectors to be used for the lock mechanism
   * @return {void}
   */
  setLockStatesForDetectors(detectors) {
    for (const detectorName of detectors) {
      this._locksByDetector[detectorName] = new Lock(detectorName);
    }
  }

  /**
   * Return the states of all locks currently used by the system grouped by the detector name
   * @returns {Object<String, Lock>}
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
   * @return {Object<String, Lock>}
   * @throws {UnauthorizedAccessError}
   */
  takeLock(detectorName, user, shouldForce = false) {
    const lock = this._locksByDetector[detectorName];

    if (lock.state === LockState.TAKEN) {
      if (!lock.isAssignedToUser(user) && !shouldForce) {
        throw new UnauthorizedAccessError(`Unauthorized TAKE action for lock of detector ${detectorName}`);
      }
      if (lock.isAssignedToUser(user)) {
        return this._locksByDetector;
      }
    }
    this._locksByDetector[detectorName].assignUser(user);

    this._broadcastService.broadcast(PADLOCK_UPDATE, this._locksByDetector);
    return this._locksByDetector;
  }

  /** 
   * Method to try to release lock for a specified detector by a user
   * @param {String} detectorName - detector name as defined by AliECS
   * @param {User} user - user that wishes to release the lock
   * @param {Boolean} shouldForce - lock should be taken even if held by another user
   * 
   * @return {Object<String, Lock>}
   * @throws {UnauthorizedAccessError}
   */
  releaseLock(detectorName, user, shouldForce = false) {
    const lock = this._locksByDetector[detectorName]
    if (lock.state === LockState.FREE) {
      return this._locksByDetector;
    }
    if (!lock.isAssignedToUser(user) && !shouldForce) {
      throw new UnauthorizedAccessError(`Unauthorized RELEASE action for lock of detector ${detectorName}`);
    }
    this._locksByDetector[detectorName].removeUser();

    this._broadcastService.broadcast(PADLOCK_UPDATE, this._locksByDetector);
    return this._locksByDetector;
  }
}

exports.LockService = LockService;
