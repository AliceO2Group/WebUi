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
const {errorHandler} = require('../utils.js');

/**
 * Model representing the lock of the UI, one owner at a time
 */
class LockService {
  /**
   * Initialize lock as free / unlocked.
   */
  constructor() {
    this.lockedBy = {};
    this.lockedByName = {};

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/lockservice`);
  }

  /**
   *  Sets WebSocket instance
   *  @param {object} ws
   */
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
   * Method to check if lock is taken by specific user
   * @param {String} detector - detector for which check should be done
   * @param {Number} userId - id of the user that should be checked against
   * @param {String} userName - username of the user that should be checked against
   */
  isLockTakenByUser(detector, userId, userName) {
    return this.lockedBy[detector] === userId && this.lockedByName[detector] === userName;
  }
}

module.exports = {LockService};
