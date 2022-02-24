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
const log = new Log(`${process.env.npm_config_log_label ?? 'cog'}/lockservice`);

/**
 * Model representing the lock of the UI, one owner at a time
 */
class Lock {
  /**
   * Initialize lock as free / unlocked.
   */
  constructor() {
    this.lockedBy = {};
    this.lockedByName = {};
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
   * Method to try to acquire lock
   * @param {Request} req
   * @param {Response} res
   */
  lockDetector(req, res) {
    try {
      if (!('name' in req.body)) {
        throw new Error('Unspecified lock entity');
      }
      const entity = req.body.name;
      if ('entity' in this.lockedBy) {
        throw new Error(`Lock ${entity} is already hold by ${this.lockedByName[entity]} (id ${this.lockedBy[entity]})`);
      }   
      this.lockedBy[entity] = req.session.personid;
      this.lockedByName[entity] = req.session.name;
      log.info(`Lock ${entity} taken by ${req.session.name}`);
      this.broadcastLockState();
      res.status(200).json({ok: true});
    } catch (error) {
      log.error(`Unable to lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
    }
  }

  /** 
   * Method to try to release lock
   * @param {Request} req
   * @param {Response} res
  */
  forceUnlock(req, res) {
    try {
      if (!('name' in req.body)) {
        throw new Error('Unspecified lock entity');
      }
      const entity = req.body.name;
      if ('entity' in this.lockedBy) {
        throw new Error(`Lock ${entity} is already released`);
      }   
      if (!req.session.access.includes('admin')) {
        throw new Error(`Insufficient permission`);
      }   
      delete this.lockedBy[entity];
      delete this.lockedByName[entity];
      log.info(`Lock ${entity} forced by ${req.session.name}`);
      this.broadcastLockState();
      res.status(200).json({ok: true});
    } catch (error) {
      log.error(`Unable to force lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
    }   
  }

  /** 
   * Method to try to release lock
   * @param {Request} req
   * @param {Response} res
   */
  unlockDetector(req, res) {
    try {
      if (!('name' in req.body)) {
        throw new Error('Unspecified lock entity');
      }
      const entity = req.body.name;
      if ('entity' in this.lockedBy) {
        throw new Error('Lock is already released');
      }
      if (this.lockedBy[entity] !== req.session.personid) {
        throw new Error(` ${entity} owner is ${this.lockedByName} (id ${this.lockedBy})`);
      }
      delete this.lockedBy[entity];
      delete this.lockedByName[entity];
      log.info(`Lock ${entity} released by ${req.session.name}`);
      this.broadcastLockState();
      res.status(200).json({ok: true});
    } catch (error) {
      log.error(`Unable to give away lock to ${req.session.name}: ${error}`);
      res.status(403).json({message: error.message});
    }   
  }
}

module.exports = Lock;
