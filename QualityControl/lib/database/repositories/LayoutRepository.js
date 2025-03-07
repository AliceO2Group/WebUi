/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { LogManager } from '@aliceo2/web-ui';
const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/json`);
import fs from 'fs';
import path from 'path';
import { Lock } from './utils/Lock';

/**
 * LayoutRepository class to handle CRUD operations for Layouts.
 */
export default class LayoutRepository {
  constructor(pathname) {
    // Path of the file to store data
    this.pathname = path.join(pathname);
    this.pathnameTmp = `${this.pathname}~tmp`;
    this.data = { layouts: [], users: [] };
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
    logger.info(`Preferences will be saved in ${this.pathname}`);
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
            logger.info('DB file does not exist, will create one');
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
          logger.info('DB file updated');
          resolve();
        });
      });
    });

    this.lock.release();
  }

  findLayoutById(layoutId) {
    return this.data.layouts.find((layout) => layout.id === layoutId);
  }

  findLayoutByName(layoutName) {
    return this.data.layouts.find((layout) => layout.name === layoutName);
  }

  createLayout(newLayout) {
    this.data.layouts.push(newLayout);
    this._writeToFile();
  }

  updateLayout(layout, newData) {
    Object.assign(layout, newData);
    this._writeToFile();
  }

  deleteLayout(layout) {
    const index = this.data.layouts.indexOf(layout);
    this.data.layouts.splice(index, 1);
    this._writeToFile();
  }

  listLayouts(filter = {}) {
    return this.data.layouts.filter((layout) =>
      (filter.owner_id === undefined || layout.owner_id === filter.owner_id)
            && (filter.name === undefined || layout.name === filter.name));
  }
}
