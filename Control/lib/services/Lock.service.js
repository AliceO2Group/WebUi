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

  setWs(ws) {
    this.webSocket = ws;
  }

  /**
   * Provides state of all locks
   * @returns {object}
   */
  state() {
    return {
      lockedBy: this.lockedBy,
      lockedByName: this.lockedByName
    }
  }

  /** 
   * Send to all users state of Pad via Websocket
   */
  broadcastLockState() {
    this.webSocket.broadcast(new WebSocketMessage().setCommand('padlock-update').setPayload(this.state()));
  }

  /** 
   * Method to try to acquire lock with given name
   * @param {Request} req - expects lock name under req.body.name
   * @param {Response} res
   */
  lockDetector(req, res) {
    try {
      const entity = req.body?.name;
      const {personid, name} = req.session;
      if (!entity) {
        throw new Error('Unspecified lock entity');
      }
      if (entity in this.lockedBy) {
        const lockUser = this.lockedBy[entity];
        const lockUsername = this.lockedByName[entity];
        if (lockUser === personid && name === lockUsername) {
          res.status(200).json({
            lockedBy: this.lockedBy,
            lockedByName: this.lockedByName
          });
          return;
        }
        throw new Error(`Lock ${entity} is already hold by ${this.lockedByName[entity]} (id ${this.lockedBy[entity]})`);
      }
      this.lockedBy[entity] = req.session.personid;
      this.lockedByName[entity] = req.session.name;
      this._logger.info(`Lock ${entity} taken by ${req.session.name}`);
      this.broadcastLockState();
      res.status(201).json({
        lockedBy: this.lockedBy,
        lockedByName: this.lockedByName
      });
    } catch (error) {
      errorHandler(`Unable to lock by ${req.session.name}: ${error}`, res, 403, 'lockservice');
    }
  }

  /** 
   * Method to try to release lock with given name
   * @param {Request} req - expects lock name under req.body.name
   * @param {Response} res
  */
  forceUnlock(req, res) {
    try {
      const entity = req.body?.name;
      if (!entity) {
        throw new Error('Unspecified lock entity');
      }
      if (!(entity in this.lockedBy)) {
        res.status(200).json({
          lockedBy: this.lockedBy,
          lockedByName: this.lockedByName
        });
      }
      if (!req.session.access.includes('admin')) {
        throw new Error(`Insufficient permission`);
      }
      delete this.lockedBy[entity];
      delete this.lockedByName[entity];
      this._logger.info(`Lock ${entity} forced by ${req.session.name}`);
      this.broadcastLockState();
      res.status(200).json({
        lockedBy: this.lockedBy,
        lockedByName: this.lockedByName
      });
    } catch (error) {
      errorHandler(`Unable to force lock by ${req.session.name}: ${error}`, res, 403, 'lockservice');
    }
  }

  /** 
   * Method to try to release lock with given name
   * @param {Request} req - expects lock name under req.body.name
   * @param {Response} res
   */
  unlockDetector(req, res) {
    try {
      const entity = req.body?.name;
      if (!entity) {
        throw new Error('Unspecified lock entity');
      }
      if (!(entity in this.lockedBy)) {
        res.status(200).json({
          lockedBy: this.lockedBy,
          lockedByName: this.lockedByName
        });
        return;
      }
      if (this.lockedBy[entity] !== req.session.personid) {
        throw new Error(`${entity} owner is ${this.lockedByName[entity]} (id ${this.lockedBy[entity]})`);
      }
      delete this.lockedBy[entity];
      delete this.lockedByName[entity];
      this._logger.info(`Lock ${entity} released by ${req.session.name}`);
      this.broadcastLockState();
      res.status(200).json({
        lockedBy: this.lockedBy,
        lockedByName: this.lockedByName
      });
    } catch (error) {
      errorHandler(`Unable to give away lock to ${req.session.name}: ${error}`, res, 403, 'lockservice');
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

  /**
   * Checks if the given user has the lock for the provided list of detectors
   * @param {String} userName - of user to check lock ownership
   * @param {Number} userId - person id of the user
   * @param {Array<string>} detectors - list of detectors to check lock is owned by the user
   * @returns {boolean}
   */
  hasLocks(userName, userId, detectors) {
    return detectors.every((detector) => this.isLockTakenByUser(detector, userId, userName));
  }
}

exports.LockService = LockService;
