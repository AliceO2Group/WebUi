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

const {WebSocketMessage, Log} = require('@aliceo2/web-ui');
const {UnauthorizedAccessError} = require('../errors/UnauthorizedAccessError');

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
   * @param {WebSocket} webSocketService - service to use to broadcast lock state changes
   */
  constructor(webSocketService) {
    this._wss = webSocketService;

    this._lockedBy = {};
    this._lockedByName = {};

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/lock-service`);
  }

  /**
   * Provides state of all locks
   * @returns {object}
   */
  state() {
    return {
      lockedBy: this._lockedBy,
      lockedByName: this._lockedByName
    }
  }

  /** 
   * Send to all users state of Pad via Websocket
   */
  broadcastLockState() {
    this._wss.broadcast(new WebSocketMessage().setCommand('padlock-update').setPayload(this.state()));
  }

  /** 
   * Method to try to acquire lock for a specified detector by a user
   * @param {String} detector - detector as defined by AliECS
   * @param {Number} userId - id of the user attempting to acquire lock
   * @param {String} userName - userName of the user attempting to acquire lock
   * @param {Boolean} shouldForce - lock should be taken even if held by another user
   */
  takeLock(detector, userId, userName, shouldForce = false) {
    if (detector in this._lockedBy && detector in this._lockedByName) {
      const userIdOwningLock = this._lockedBy[detector];
      const userNameOwningLock = this._lockedByName[detector];
      if (userIdOwningLock === userId && userName === userNameOwningLock) {
        return this.state();
      }
      if (!shouldForce) {
        throw new UnauthorizedAccessError(
          `Lock ${detector} is already held by ${userNameOwningLock} (id ${userIdOwningLock})`
        );
      }
    }
    this._lockedBy[detector] = userId;
    this._lockedByName[detector] = userName;
    this.broadcastLockState();
    return this.state();
  }

  /** 
   * Method to try to release lock for a specified detector by a user
   * @param {String} detector - detector as defined by AliECS
   * @param {Number} userId - id of the user attempting to acquire lock
   * @param {String} userName - userName of the user attempting to acquire lock
   * @param {Boolean} shouldForce - lock should be taken even if held by another user
   */
  releaseLock(detector, userId, userName, shouldForce = false) {
    if (!(detector in this._lockedBy) && !(detector in this._lockedByName)) {
      return this.state();
    }
    if (this._lockedBy[detector] !== userId && this._lockedByName[detector] !== userName && !shouldForce) {
      throw new UnauthorizedAccessError(
        `Owner for ${detector} lock is ${this._lockedByName[detector]} (id ${this._lockedBy[detector]})`
      );
    }
    delete this._lockedBy[detector];
    delete this._lockedByName[detector];
    this.broadcastLockState();
    return this.state();
  }

  /**
   * Method to check if lock is taken by specific user
   * @param {String} detector - detector for which check should be done
   * @param {Number} userId - id of the user that should be checked against
   * @param {String} userName - username of the user that should be checked against
   */
  isLockOwnedByUser(detector, userId, userName) {
    return this._lockedBy[detector] === userId && this._lockedByName[detector] === userName;
  }
}

module.exports = {LockService};
