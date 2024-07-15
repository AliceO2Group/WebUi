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

import { Log } from '@aliceo2/web-ui';
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/json`);
import fs from 'fs';
import path from 'path';
import { NotFoundError } from './../errors/NotFoundError.js';

/**
 * Store layouts inside JSON based file with atomic write
 */
export class JsonFileService {
  /**
   * Initialize connector by synchronizing DB file and its internal state
   * @param {string} pathname - path to JSON DB file
   */
  constructor(pathname) {
    // Path of the file to store data
    this.pathname = path.join(pathname);

    // Path for writing file
    this.pathnameTmp = `${this.pathname}~tmp`;

    // Mirror data from content of JSON file
    this.data = { layouts: [], users: [] };

    // Write lock access
    this.lock = new Lock();

    this._syncFileAndInternalState();
  }

  /**
   * Synchronize DB file content and `this.data` property
   * @returns {undefined}
   */
  async _syncFileAndInternalState() {
    await this._readFromFile();
    await this._writeToFile();
    log.info(`Preferences will be saved in ${this.pathname}`);
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
            log.info('DB file does not exist, will create one');
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
   * Write data to disk, atomically, with lock
   * @returns {undefined}
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
          log.info('DB file updated');
          resolve();
        });
      });
    });

    this.lock.release();
  }

  /**
   * Create a layout
   * @param {Layout} newLayout - layout object to be saved
   * @returns {object} Empty details
   */
  async createLayout(newLayout) {
    if (!newLayout.id) {
      throw new Error('layout id is mandatory');
    }
    if (!newLayout.name) {
      throw new Error('layout name is mandatory');
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
   * @returns {Layout} - layout object
   * @throws {Error}
   */
  async readLayout(layoutId) {
    const layout = this.data.layouts.find((layout) => layout.id === layoutId);
    if (!layout) {
      throw new Error(`layout (${layoutId}) not found`);
    }
    return layout;
  }

  /**
   * Given a string, representing layout name, retrieve the layout if it exists
   * @param {string} layoutName - name of the layout to retrieve
   * @returns {Layout} - object with layout information
   * @throws
   */
  async readLayoutByName(layoutName) {
    const layout = this.data.layouts.find((layout) => layout.name === layoutName);
    if (!layout) {
      throw new NotFoundError(`Layout (${layoutName}) not found`);
    }
    return layout;
  }

  /**
   * Update a single layout by its id
   * @param {string} layoutId - id of the layout to be updated
   * @param {Layout} data - layout new data
   * @returns {object} Empty details
   */
  async updateLayout(layoutId, data) {
    const layout = await this.readLayout(layoutId);
    Object.assign(layout, data);
    this._writeToFile();
    return layoutId;
  }

  /**
   * Delete a single layout by its id
   * @param {string} layoutId - id of the layout to be removed
   * @returns {object} Empty details
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
   * @param {object} filter - accepted keys [owner_id, name]
   * @returns {Array<Layout>} - list of layouts as per the filter
   */
  async listLayouts(filter = {}) {
    return this.data.layouts.filter((layout) =>
      (filter.owner_id === undefined || layout.owner_id === filter.owner_id)
      && (filter.name === undefined || layout.name === filter.name));
  }

  /**
   * Return an object by its id that is saved within a layout
   * @param {string} id - id of the object to retrieve
   * @returns {{object: object, layoutName: string}} - object configuration stored
   */
  getObjectById(id) {
    if (!id) {
      throw new Error('Missing mandatory parameter: id');
    }
    for (const layout of this.data.layouts) {
      for (const tab of layout.tabs) {
        for (const object of tab.objects) {
          if (object.id === id) {
            return { object, layoutName: layout.name };
          }
        }
      }
    }
    throw new Error(`Object with ${id} could not be found`);
  }

  /* User helpers */

  /**
   * Check if a user is saved and if not, add it to the in-memory list and db
   * @param {JSON} user - data of the user to be added
   * @returns {undefined}
   */
  addUser(user) {
    this._validateUser(user);
    const isUserPresent = this.data.users
      .findIndex((userEl) => user.id === userEl.id && user.name === userEl.name) !== -1;

    if (!isUserPresent) {
      this.data.users.push(user);
      this._writeToFile();
    }
  }

  /**
   * Validate that a user JSON contains all the mandatory fields
   * @param {JSON} user - data of the user to be added
   * @returns {undefined}
   * @throws {Error}
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
