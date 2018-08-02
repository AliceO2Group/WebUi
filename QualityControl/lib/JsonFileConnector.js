const {log} = require('@aliceo2/web-ui');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
    this.pathnameTmp = path.join(os.tmpdir(), 'qcg-tmp-db.json');

    // Mirror data from content of JSON file
    this.data = {layouts: []};

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
      const dataToFile = JSON.stringify(this.data, null, 2);

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
   * @param {Layout} layout
   * @return {Object} Empty details
   */
  async createLayout(layout) {
    this.data.layouts.push(layout);
    this._writeToFile();
    return {};
  }

  /**
   * List layouts, can be filtered
   * @param {Object} filter - undefined or {owner_id: XXX}
   * @return {Array<Layout>}
   */
  async listLayouts(filter = {}) {
    return this.data.layouts.filter((layout) => {
      if (filter.owner_id !== undefined && layout.owner_id !== filter.owner_id) {
        return false;
      }

      return true;
    });
  }

  /**
   * Retrieve a layout or null
   * @param {string} layoutName - layout name
   * @return {Layout|null}
   */
  async readLayout(layoutName) {
    return this.data.layouts.find((layout) => layout.name === layoutName);
  }

  /**
   * Update a single layout by its name
   * @param {string} layoutName
   * @param {Layout} data
   * @return {Object} Empty details
   */
  async writeLayout(layoutName, data) {
    const layout = this.data.layouts.find((layout) => layout.name === layoutName);
    if (!layout) {
      throw new Error('layout not found');
    }
    Object.assign(layout, data);
    this._writeToFile();
    return {};
  }

  /**
   * Delete a single layout by its name
   * @param {string} layoutName
   * @return {Object} Empty details
   */
  async deleteLayout(layoutName) {
    const layout = this.data.layouts.find((layout) => layout.name === layoutName);
    if (!layout) {
      throw new Error(`layout ${layoutName} not found`);
    }
    const index = this.data.layouts.indexOf(layout);
    this.data.layouts.splice(index, 1);
    this._writeToFile();
    return {};
  }
}

/**
 * Simple Lock blocked Promise for exclusive access to ressource
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
