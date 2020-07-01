const log = new (require('@aliceo2/web-ui').Log)('InfoLoggerJson');
const fs = require('fs');
const path = require('path');

/**
 * Store user's profiles inside JSON based file with atomic write
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
    this.data = {profiles: []};

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
          if (!dataFromFile || !dataFromFile.profiles || !Array.isArray(dataFromFile.profiles)) {
            return reject(new Error(`DB file should have an array of profiles ${this.pathname}`));
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
   * Create a new profile for a user with provided content
   * Adds created & lastModified timestamps
   * @param {string} username
   * @param {JSON} content
   * @return {boolean}
   */
  async createNewProfile(username, content) {
    if (username == undefined) {
      throw new Error(`username for profile is mandatory`);
    }

    const profile = this.data.profiles.find((profile) => profile.username === username);
    if (profile) {
      throw new Error(`Profile with this username (${username}) already exists`);
    }
    const dateNow = Date.now();
    const profileEntry = {
      username: username,
      createdTimestamp: dateNow,
      lastModifiedTimestamp: dateNow,
      content: content
    };

    this.data.profiles.push(profileEntry);
    await this._writeToFile();
    return profileEntry;
  }

  /**
   * Retrieve a profile or undefined if it does not exist
   * @param {string} username
   * @return {JSON}
   */
  async getProfileByUsername(username) {
    const profile = this.data.profiles.find((profile) => profile.username === username);
    if (!profile) {
      return undefined;
    }
    return profile;
  }

  /**
   * Retrieve a profile or undefined if it does not exist
   * @param {string} profile
   * @return {JSON}
   */
  async getPredefinedProfile(profile) {
    return undefined;
  }

  /**
   * Update a single profile by its username with the provided content
   * Updates lastModified timestamp
   * @param {string} username
   * @param {JSON} content
   * @return {Object} updatedProfile
   */
  async updateProfile(username, content) {
    const profile = await this.getProfileByUsername(username);
    if (profile) {
      Object.assign(profile.content, content);
      profile.lastModifiedTimestamp = Date.now();
      this._writeToFile();
      return profile;
    } else {
      throw new Error(`Profile with this username (${username}) cannot be updated as it does not exist`);
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
