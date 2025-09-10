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

import { LogManager } from '@aliceo2/web-ui';
import fs from 'fs';
import path from 'path';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/json-service`;

/**
 * Store layouts inside JSON based file with atomic write
 */
export class JsonFileService {
  /**
   * Initialize connector by synchronizing DB file and its internal state
   * @param {string} pathname - path to JSON DB file
   */
  constructor(pathname) {
    this._logger = LogManager.getLogger(LOG_FACILITY);

    // Path of the file to store data
    this.pathname = path.join(pathname);
    this.pathnameTmp = `${this.pathname}~tmp`;
    this.data = { layouts: [], users: [] };
    this.lock = new Lock();
    this.ready = this._syncFileAndInternalState();
  }

  /**
   * Synchronize DB file content and `this.data` property
   * @returns {undefined}
   */
  async _syncFileAndInternalState() {
    await this._readFromFile();
    await this.writeToFile();
    this._logger.infoMessage(`Preferences will be saved in ${this.pathname}`);
  }

  /**
   * Method to read from file and update the data variable
   * @returns {Promise<undefined.Error>} - rejects if unable to read file
   */
  async _readFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.pathname, (err, data) => {
        if (err) {
          // File does not exist, it's ok, we will create it
          if (err.code === 'ENOENT') {
            this._logger.infoMessage('DB file does not exist, will create one');
            return resolve();
          }

          // Other errors reading
          return reject(err);
        }

        try {
          const dataFromFile = JSON.parse(data);

          // Check data we just read
          if (!dataFromFile || !dataFromFile.layouts || !Array.isArray(dataFromFile.layouts)) {
            return reject(new Error(`DB file should have an array of layouts ${this.pathname}`));
          }
          // Check if users exists and if not declare and initialize with an empty array
          if (!dataFromFile.users || !Array.isArray(dataFromFile.users)) {
            dataFromFile.users = [];
          }
          this.data = dataFromFile;
          resolve();
        } catch {
          return reject(new Error(`Unable to parse DB file ${this.pathname}`));
        }
      });
    });
  }

  /**
   * Write data to disk, atomically, with lock.
   * @returns {Promise<void>}
   */
  async writeToFile() {
    await this.lock.acquire(); // Acquire the lock

    try {
      const dataToFile = JSON.stringify(this.data, null, 1);
      await fs.promises.writeFile(this.pathnameTmp, dataToFile);
      await fs.promises.rename(this.pathnameTmp, this.pathname);
      this._logger.infoMessage('DB file updated');
    } catch (err) {
      this._logger.errorMessage('Error writing to DB file:', err);
      throw err;
    } finally {
      this.lock.release();
    }
  }
}

class Lock {
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
