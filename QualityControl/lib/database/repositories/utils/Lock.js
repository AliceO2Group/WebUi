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
 * Simple Lock blocked Promise for exclusive access to resource
 * @example
 * let lock = new Lock();
 * lock.acquire();
 * setTimeout(() => lock.release(), 1000);
 * await lock.acquire(); // will wait 1000ms
 */
export class Lock {
  /**
   * Initialize lock to released
   */
  constructor() {
    this._locked = false;
    this._queue = []; // Callbacks of next owners of the lock
  }

  /**
   * Acquires lock if available and returns immediately
   * otherwise wait for lock to be released
   * @returns {Promise} - result of the lock
   */
  acquire() {
    return new Promise((resolve) => {
      // If nobody has the lock, take it and resolve immediately
      if (!this._locked) {
        this._locked = true;
        return resolve();
      }

      // Otherwise, push as next owner
      this._queue.push(resolve);
    });
  }

  /**
   * Releases lock and give it to next in queue if any
   * @returns {object|undefined} - next owner of the lock
   */
  release() {
    // Release the lock immediately
    setImmediate(() => {
      const nextOwner = this._queue.shift();
      if (nextOwner) {
        this._locked = true;
        return nextOwner();
      }

      this._locked = false;
    });
  }
}
