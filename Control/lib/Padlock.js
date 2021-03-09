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

/**
 * Model representing the lock of the UI, one owner at a time
 */
class Padlock {
  /**
   * Initialize lock as free / unlocked.
   */
  constructor() {
    this.lockedBy = null; // null | Number (can be zero!)
    this.lockedByName = null; // string
  }

  /**
   * Take the lock by someone.
   * Fails if the lock is already taken.
   * @param {number} personid - someone's id
   * @param {string} name - someone's name
   */
  lockBy(personid, name) {
    if (this.lockedBy !== null) {
      throw new Error(`[Padlock] Lock is already hold by ${this.lockedByName} (id ${this.lockedBy})`);
    }
    this.lockedBy = personid;
    this.lockedByName = name;
  }

  /**
   * Tries to force unlock
   * Requires admin auth level (2)
   * @param {number} auth - auth level
   */
  forceUnlock(auth) {
    if (this.lockedBy === null) {
      throw new Error(`[Padlock] Lock is already released`);
    }
    if (auth !== 2) {
      throw new Error(`[Padlock] Insufficient permission`);
    }
    this.lockedBy = null;
    this.lockedByName = null;
  }

  /**
   * Release lock by someone who must be the actual owner.
   * Fails if the lock is not taken or taken by someone else.
   * @param {number} personid - someone's id
   */
  unlockBy(personid) {
    if (this.lockedBy === null) {
      throw new Error('[Padlock] Lock is already released');
    }

    if (this.lockedBy !== personid) {
      throw new Error(`[Padlock] You cannot unlock, owner is ${this.lockedByName} (id ${this.lockedBy})`);
    }

    this.lockedBy = null;
    this.lockedByName = null;
  }
}

module.exports = Padlock;
