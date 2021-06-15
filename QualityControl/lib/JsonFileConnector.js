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

const log = new (require('@aliceo2/web-ui').Log)('QualityControl/JsonFileConnector');
const fs = require('fs');
const path = require('path');

/**
 * Store layouts inside JSON based file with atomic write
 */
class JsonFileConnector {
  /**
   * Initialize connector by synchronizing DB file and its internal state
   * @param {string} pathname - path to JSON DB file
   */
  constructor(pathname) {
    // Path of the file to store data
    this.pathname = path.join(pathname);

    // Path for writing file
    this.pathnameTmp = this.pathname + '~tmp';

    // Mirror data from content of JSON file
    this.data = {layouts: [], users: []};

    // Write lock access
    this.lock = new Lock();

    this._syncFileAndInternalState();
  }

  /**
   * Synchronize DB file content and `this.data` property
   */
  async _syncFileAndInternalState() {
    await this._readFromFile();
    await this._writeToFile();
    log.info(`Preferences will be saved in ${this.pathname}`);
  }

  /**
   * Read
   * @param {string} argName - blabla
   * @return {string} blabla
   */
  async _readFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.pathname, (err, data) => {
        if (err) {
          // file does not exist, it's ok, we will create it
          if (err.code === 'ENOENT') {
            log.info('DB file does not exist, will create one');
            return resolve();
          }

          // other errors reading
          return reject(err);
        }

        try {
          const dataFromFile = JSON.parse(data);

          // check data we just read
          if (!dataFromFile || !dataFromFile.layouts || !Array.isArray(dataFromFile.layouts)) {
            return reject(new Error(`DB file should have an array of layouts ${this.pathname}`));
          }
          // check if users exists and if not declare and initialize with an empty array
          if (!dataFromFile.users || !Array.isArray(dataFromFile.users)) {
            dataFromFile.users = [];
          }
          this.data = dataFromFile;
          resolve();
        } catch (e) {
          return reject(new Error(`Unable to parse DB file ${this.pathname}`));
        }
      });
    });
  }

  /**
   * Write data to disk, atomically, with lock
   */
  async _writeToFile() {
    await this.lock.acquire();

    await new Promise((resolve, reject) => {
      const dataToFile = JSON.stringify(this.data, null, 1);

      fs.writeFile(this.pathnameTmp, dataToFile, (err) => {
        if (err) {
          return reject(err);
        }
        fs.rename(this.pathnameTmp, this.pathname, (err) => {
          if (err) {
            return reject(err);
          }
          log.info(`DB file updated`);
          resolve();
        });
      });
    });

    this.lock.release();
  }

  /**
   * Create a layout
   * @param {Layout} newLayout
   * @return {Object} Empty details
   */
  async createLayout(newLayout) {
    if (!newLayout.id) {
      throw new Error(`layout id is mandatory`);
    }
    if (!newLayout.name) {
      throw new Error(`layout name is mandatory`);
    }

    const layout = this.data.layouts.find((layout) => layout.id === newLayout.id);
    if (layout) {
      throw new Error(`layout with this id (${layout.id}) already exists`);
    }
    this.data.layouts.push(newLayout);
    await this._writeToFile();
    return newLayout;
  }

  /**
   * Retrieve a layout or undefined
   * @param {string} layoutId - layout id
   * @return {Layout|undefined}
   */
  async readLayout(layoutId) {
    const layout = this.data.layouts.find((layout) => layout.id === layoutId);
    if (!layout) {
      throw new Error(`layout (${layoutId}) not found`);
    }
    return layout;
  }

  /**
   * Update a single layout by its id
   * @param {string} layoutId
   * @param {Layout} data
   * @return {Object} Empty details
   */
  async updateLayout(layoutId, data) {
    const layout = await this.readLayout(layoutId);
    Object.assign(layout, data);
    this._writeToFile();
    return layoutId;
  }

  /**
   * Delete a single layout by its id
   * @param {string} layoutId
   * @return {Object} Empty details
   */
  async deleteLayout(layoutId) {
    const layout = await this.readLayout(layoutId);
    const index = this.data.layouts.indexOf(layout);
    this.data.layouts.splice(index, 1);
    await this._writeToFile();
    return layoutId;
  }

  /**
   * List layouts, can be filtered
   * @param {Object} filter - undefined or {owner_id: XXX}
   * @return {Array<Layout>}
   */
  async listLayouts(filter = {}) {
    return this.data.layouts.filter((layout) =>
      filter.owner_id === undefined || layout.owner_id === filter.owner_id);
  }

  /* User helpers */

  /**
   * Check if a user is saved and if not, add it to the in-memory list and db
   * @param {JSON} user 
   */
  addUser(user) {
    this._validateUser(user);
    const isUserPresent = this.data.users.findIndex(
      (userEl) => user.id === userEl.id && user.name === userEl.name) !== -1;

    if (!isUserPresent) {
      this.data.users.push(user);
      this._writeToFile();
    }
  }

  /**
   * Validate that a user JSON contains all the mandatory fields
   * @param {JSON} user
   */
  _validateUser(user) {
    if (!user) {
      throw new Error('User Object is mandatory');
    }
    if (!user.username) {
      throw new Error('Field username is mandatory');
    }
    if (!user.name) {
      throw new Error('Field name is mandatory');
    }
    if (user.id === null || user.id === undefined || user.id === '') {
      throw new Error('Field id is mandatory');
    }
    if (isNaN(user.id)) {
      throw new Error('Field id must be a number');
    }
  }
}

/**
 * Simple Lock blocked Promise for exclusive access to resource
 * @example
 * let lock = new Lock();
 * lock.acquire();
 * setTimeout(() => lock.release(), 1000);
 * await lock.acquire(); // will wait 1000ms
 */
class Lock {
  /**
   * Initialize lock to released
   */
  constructor() {
    this._locked = false;
    this._queue = []; // callbacks of next owners of the lock
  }

  /**
   * acquires lock if available and returns immediately
   * otherwise wait for lock to be released
   * @return {Promise}
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
   * releases lock and give it to next in queue if any
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

module.exports = JsonFileConnector;
