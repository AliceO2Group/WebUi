/**
 * Module dependencies.
 */
const fs = require('fs');
const os = require('os');
const tar = require('tar');
const http = require('http');

/**
 * The variables used in the program
 * @var DIR_PERMS {KEY: number,...} Octal notation of permissions in linux for reading, writing and execution
 * @var TMP_DIR {string}            The path used for storing all temporary directory paths used in root object download requests.
 */
const DIR_PERMS = {
  OWNER_RWX: 0o700, //Octal notation of 700 in Linux, used to give read, write and execution permissions.
  OWNER_RW: 0o600, //Octal notation of 600 in Linux, used to give read and write permissions, no execution rights though.
};
const TMP_DIR = `${os.homedir()}/.${os.tmpdir().replace('/', '')}/root_obj`; // Format on Linux is `/home/$USER/.tmp/root_obj`

/**
 * Class to generate a /tmp directory in the home directory, to allow users to download root objects
 * @author Colin Laan <colin.laan@gmail.com>
 */
class SimpleTmp {
  /**
   * Allows the CCDB url to be altered, together with the generated tar file names and the event at which /tmp is cleared.
   * @param {Object} config The configuration used for this class.
   */
  constructor(config) {
    if (!config) {
      throw new Error('Configuration object cannot be empty');
    }
    if (!config.ccdb_server_url) {
      throw new Error('Configuration object must include the CCDB server url for downloads');
    }
    if (!config.tarFileName) {
      throw new Error('Configuration object must include the downloadable tar file name');
    }
    if (!config.cleanUpEvent) {
      throw new Error('Configuration object must include the clean up event for the /tmp directory');
    }

    this.ccdb_server_url = config.ccdb_server_url;
    this.tarFileName = config.tarFileName;
    this.cleanUpEvent = config.cleanUpEvent;
  }

  /**
   * Creates a temporary directory located at /tmp by default.
   * @param {string} path                     Path in which the temporary directory should be made.
   * @param {function} callback               Function that is returned to caller.
   * @callback prepareRootTmpRemovalOnSysExit Exit function to remove /tmp dir recursively.
   * @return {void}
   */
  initTmpDir(path, callback) {
    console.log('Initializing...');
    if (fs.existsSync(TMP_DIR)) {
      return null;
    }
    console.log('Directory does not exist, proceeding...');
    fs.mkdir(TMP_DIR, DIR_PERMS.OWNER_RW && { recursive: true }, (err) => {
      if (err) {
        return err;
      }
      console.log('Made dir `~/.tmp/root_obj/`');
      this.prepareRootTmpRemovalOnSysExit(TMP_DIR, callback);
    });
  }

  /**
   * Creates a new temporary directory for the requested id
   * @param {string} request_id The requester's id used for the subdirectory under which the files are stored temporarily.
   * @returns {void}
   */
  initNewRequestDir(request_id) {
    console.log('Creating request directory');
    const dir = `${TMP_DIR}/${request_id}`;

    fs.mkdir(dir, DIR_PERMS.OWNER_RW && { recursive: true }, (err) => {
      if (err) {
        console.log(err);
      }
      console.log('Created request directory');
      this.scheduleRequestDirRemoval(dir);
    });
  }

  /**
   * Schedules a requester's subdirectory to be removed after 15 minutes
   * @param {string} dir The path of the directory that is scheduled for removal
   */
  scheduleRequestDirRemoval(dir) {
    console.log('Scheduled request directory deletion');
    setTimeout(() => {
      console.log('Deleting request directory...');
      this.deleteRequestDir(dir);
      console.log('Done deleting request directory!');
    }, 15 * 60 * 1000);
  }

  /**
   * Requests a requester's subdirectory to be removed
   * @param {string} dir  The path of the requester's subdirectory
   * @returns {void}
   */
  deleteRequestDir(dir) {
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(dir, { recursive: true });
    }
  }

  /**
   * Deletes *all* temporary directories made by this program as a means to clean up before the application closes.
   * @param {string} path         The path of the directory to remove.
   * @param {function} callback   Returns a value to the place where this function is called
   * @returns {NodeJS.Process}    Returns the listener for the exit stored in the this.cleanUpEvent variable
   */
  prepareRootTmpRemovalOnSysExit(path, callback) {
    return process.addListener(this.cleanUpEvent, () => {
      fs.rm(path, { recursive: true }, callback);
    });
  }

  /**
   * Retrieves all files stored under the requester's temporary subdirectory and requests them to be packed up in a tarball.
   * @param {string} request_id   The id of the requester
   * @param {function} callback   Returns a value that can be handled by the place this function gets called at.
   * @returns {Promise<Pack|*>}   Returns the tarball
   */
  async retrieveFilesFromSubDir(request_id, callback) {
    console.log('Retrieving files from requester sub-directory...');
    const path = `${TMP_DIR}/${request_id}`;
    const matches_found = fs.globSync(`${path}/*.root`);
    if (matches_found != null && matches_found.length > 0) {
      return this.generateTarball(matches_found, `${path}/${this.tarFileName}.tar`);
    } else {
      return callback('no matches');
    }
  }

  /**
   * Generates a tarball of the requested files.
   * @param {Array} files The files to be put into a tarball.
   * @param {string} path The path in which the requester's files can be found.
   * @returns {Pack}      The tarball generated.
   */
  generateTarball(files, path) {
    console.log('Generating Tarball...');
    const baseDir = files[0].substring(0, files[0].lastIndexOf('/'));
    return tar.c(
      {
        file: path,
        cwd: baseDir,
      },
      files.map((file) => file.replace(`${baseDir}/`, '')),
    );
  }

  /**
   * Requests a root object download from the CCDB and stores it in the requester's subdirectory
   * @param {string} object_id    The root object etag of the object that should be downloaded.
   * @param {string} request_id   The requester's id used for the subdirectory.
   * @returns {Promise<void>}     The download request
   */
  async sendDownloadRequest(object_id, request_id) {
    const url = `${this.ccdb_server_url}/download/${object_id}`;
    const destination = `${TMP_DIR}/${request_id}/${object_id}.root`;

    try {
      const file = fs.createWriteStream(destination);
      console.log('Downloading Files...');

      await new Promise((resolve, reject) => {
        http.get(url, { method: 'GET' }, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('Downloaded file!');
            resolve(true);
          });
        }).on('error', () => {
          // Delete the file asynchronously. No response handler, just need to hook into that it failed somehow to stop the process.
          fs.unlink(destination, (err) => {
            reject(err);
          });
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Sends multiple file download requests for root objects and stores them under the requester's subdirectory
   * @param {Array<string>} object_ids  The identifiers for the root objects to be downloaded.
   * @param {string} request_id         The requester's id used for the subdirectory of the root one.
   * @returns {void}
   */
  async sendDownloadRequests(object_ids, request_id) {
    for (const obj_id in object_ids) {
      await this.sendDownloadRequest(obj_id, request_id);
    }
  }

  /**
   * Returns the tarball generated previously.
   * @param {string} request_id The requester's id used for the subdirectory the file is stored in.
   * @returns {Promise<null>}
   */
  async returnTarballInRequestersSubDir(request_id) {
    const path = `${TMP_DIR}/${request_id}`;
    const file = `${path}/${this.tarFileName}.tar`;
    let dataHolder = null;
    fs.readFile(file, (err, data) => {
      if (err) {
        console.error(err);
      }
      if (data != null) {
        dataHolder = data;
      }
    });
    this.deleteRequestDir(path);
    return dataHolder;
  }
}
