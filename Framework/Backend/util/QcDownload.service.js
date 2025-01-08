/**
 * Module dependencies.
 */
const fs = require('fs');
const os = require('os');
const tar = require('tar');
// const http = require('http');
const { LogManager } = require('../log/LogManager.js');
const { LogLevel } = require('../log/LogLevel');

/**
 * The variables used in the program
 * @var DIR_PERMS {KEY: number,...} Octal notation of permissions in linux for reading, writing and execution
 * @var CODES     {KEY: string,...} The codes this class uses for callbacks that can inform about certain actions such as directory removal.
 * @var TMP_DIR   {string}          The path used for storing all temporary directory paths used in root object download requests.
 * @var logger    {Logger}          The logger used for this class.
 */
const DIR_PERMS = Object.freeze({
  OWNER_RWX: 0o700, //Octal notation of 700 in Linux, used to give read, write and execution permissions.
  OWNER_RW: 0o600, //Octal notation of 600 in Linux, used to give read and write permissions, no execution rights though.
});
const CODES = Object.freeze({
  CLEARED_CORPSES: 'Cleared file corpses from previous process',
  UNNECESSARY_ARCHIVE: 'Singular file found, skipping generation of tarball...',
  NO_MATCHES: 'No matches for file',
});
const TMP_DIR = `${os.homedir()}/.${os.tmpdir().replace('/', '')}/root_obj`; // Format on Linux is `/home/$USER/.tmp/root_obj`
const logger = LogManager.getLogger('QcDownloadService');
const fsp = fs.promises;

/**
 * Class to generate a /tmp directory in the home directory with subdirectories that can be used to download root objects.
 * @author Colin Laan <colin.laan@gmail.com>
 */
class QcDownloadService {
  /**
   * Allows the CCDB url to be altered, together with the generated tar file names and the event at which /tmp is cleared.
   * @param {Object} qcDownloadService_config The configuration used for this class.
   * @param {Object} ccdb_config              The configuration used for the download functionality of this class.
   */
  constructor(qcDownloadService_config, ccdb_config) {
    if (!qcDownloadService_config) {
      throw new Error('Configuration object cannot be empty');
    }
    if (!ccdb_config) {
      throw new Error('Configuration object must include a CCDB config for downloads');
    }
    if (!ccdb_config.protocol) {
      throw new Error('Configuration object must include the CCDB server protocol for downloads');
    }
    if (!ccdb_config.hostname) {
      throw new Error('Configuration object must include the CCDB server domain for downloads');
    }
    if (!ccdb_config.port) {
      throw new Error('Configuration object must include the CCDB server port for downloads');
    }
    if (!qcDownloadService_config.tarFileName) {
      throw new Error('Configuration object must include the downloadable tar file name');
    }
    if (!qcDownloadService_config.cleanUpEvent) {
      throw new Error('Configuration object must include the clean up event for the /tmp directory');
    }
    if (!qcDownloadService_config.dirLifespan) {
      throw new Error('Configuration object must include the lifespan for the /tmp directory');
    }
    this._codes = CODES; // Added to constructor to make sure tests can easily access the codes used.
    this._ccdbServerUrl = `${ccdb_config.protocol}://${ccdb_config.hostname}:${ccdb_config.port}`;
    this.tarFileName = qcDownloadService_config.tarFileName;
    this.cleanUpEvent = qcDownloadService_config.cleanUpEvent;
    this.dirLifespan = qcDownloadService_config.dirLifespan;
    logger.infoMessage('Initialized QcDownloadService config!', LogLevel.DEVELOPER);
  }

  /**
   * Creates a temporary directory located at /tmp by default.
   * @param {function} callback               Function that is returned to caller.
   * @callback prepareRootTmpRemovalOnSysExit Exit function to remove /tmp dir recursively.
   * @returns {void}
   */
  async initTmpDir(callback) {
    logger.infoMessage('Initializing...');
    if (fs.existsSync(TMP_DIR)) {
      await fsp.rmdir(TMP_DIR, { recursive: true }).then(() => {
        callback(CODES.CLEARED_CORPSES);
        logger.infoMessage('Deleted previous tmp directory');
      }).catch((err) => {
        logger.errorMessage(err);
      });
    }
    logger.infoMessage('Directory no longer exists, proceeding...');
    await fsp.mkdir(TMP_DIR, DIR_PERMS.OWNER_RW && { recursive: true }).then((err) => {
      if (err) {
        return err;
      } else {
        logger.infoMessage(`Made dir '${TMP_DIR}'`);
      }
      this.prepareRootTmpRemovalOnSysExit(TMP_DIR, callback);
    });
  }

  /**
   * Creates a new temporary directory for the requested id
   * @param {string} request_id The requester's id used for the subdirectory under which the files are stored temporarily.
   * @returns {Promise}
   */
  async createNewRequestDir(request_id) {
    logger.infoMessage('Creating request directory');
    const dir = `${TMP_DIR}/${request_id}`;

    if (fs.existsSync(dir)) {
      console.log(`DIR ${dir} found.`);
    }
    return await fsp.mkdir(dir, DIR_PERMS.OWNER_RW && { recursive: true }).catch((err) => {
      if (err) {
        logger.errorMessage(`Unable to make request directory; ${err}`, LogLevel.DEVELOPER);
      }
    }).then(() => {
      if (fs.existsSync(dir)) {
        logger.infoMessage('Created request directory');
        this.scheduleRequestDirRemoval(dir);
      }
    });
  }

  /**
   * Schedules a requester's subdirectory to be removed after 15 minutes
   * @param {string} dir The path of the directory that is scheduled for removal
   * @returns {void}
   */
  scheduleRequestDirRemoval(dir) {
    logger.infoMessage('Scheduled request directory deletion');
    setTimeout(() => {
      logger.infoMessage('Deleting request directory...');
      this.deleteRequestDir(dir);
      logger.infoMessage('Done deleting request directory!');
    }, this.dirLifespan);
  }

  /**
   * Requests a requester's subdirectory to be removed
   * @param {string} dir  The path of the requester's subdirectory
   * @returns {void}
   */
  async deleteRequestDir(dir) {
    if (fs.existsSync(TMP_DIR)) {
      await fsp.rmdir(dir, { recursive: true });
    }
  }

  /**
   * Deletes *all* temporary directories made by this program as a means to clean up before the application closes.
   * @param {string} path         The path of the directory to remove.
   * @param {function} callback   Returns a value to the place where this function is called
   * @returns {NodeJS.Process}    Returns the listener for the exit stored in the this.cleanUpEvent variable
   */
  async prepareRootTmpRemovalOnSysExit(path, callback) {
    return process.addListener(this.cleanUpEvent, async () => {
      await fsp.rm(path, { recursive: true }).then((err) => {
        if (err) {
          callback(err);
        }
      });
    });
  }

  /**
   * Retrieves all files stored under the requester's temporary subdirectory and requests them to be packed up in a tarball.
   * @param {string} request_id   The id of the requester
   * @param {function} callback   Returns a value that can be handled by the place this function gets called at.
   * @returns {Promise<Pack|*>}   Returns the tarball
   */
  async retrieveFilesFromSubDir(request_id, callback) { //TODO: Fix glob instead of globSync no longer working
    logger.infoMessage('Retrieving files from requester sub-directory...');
    const path = `${TMP_DIR}/${request_id}`;
    const matches_found = [];
    await (async () => {
      for await (const entry of fsp.glob(`${path}/*.root`)) {
        matches_found.push(entry);
      }
    })();
    if (matches_found.length > 1) {
      this.generateTarball(matches_found, `${path}/${this.tarFileName}.tar`);
      //Should return fs.findFile or something;
    } else if (matches_found.length === 1) {
      return callback(CODES.UNNECESSARY_ARCHIVE);
    } else {
      return callback(CODES.NO_MATCHES);
    }
  }

  /**
   * Generates a tarball of the requested files.
   * @param {Array} files The files to be put into a tarball.
   * @param {string} path The path in which the requester's files can be found.
   * @returns {Pack}      The tarball generated.
   */
  generateTarball(files, path) {
    logger.infoMessage('Generating Tarball...');
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
   * Returns the tarball generated previously.
   * @param {string} request_id The requester's id used for the subdirectory the file is stored in.
   * @returns {Promise<null>}
   */
  async returnTarballInRequestersSubDir(request_id) {
    const path = `${TMP_DIR}/${request_id}`;
    const file = `${path}/${this.tarFileName}.tar`;
    let dataHolder = null;
    if (fs.existsSync(file)) {
      await fsp.readFile(file, (err, data) => {
        if (err) {
          logger.errorMessage(`Couldn't return tarball; ${err}`, LogLevel.DEVELOPER);
        }
        if (data != null) {
          dataHolder = data;
        }
      });
    }
    this.deleteRequestDir(path);
    return dataHolder;
  }
}

module.exports = QcDownloadService;
