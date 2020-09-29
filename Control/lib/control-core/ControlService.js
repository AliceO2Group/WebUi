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

const errorHandler = require('./../utils.js').errorHandler;
const assert = require('assert');
const log = new (require('@aliceo2/web-ui').Log)('Control-Proxy');

/**
 * Gateway for all AliECS - Core calls
 */
class ControlService {
  /**
   * Constructor initializing dependencies
   * @param {Padlock} padLock
   * @param {ControlProxy} ctrlProx
   */
  constructor(padLock, ctrlProx) {
    assert(padLock, 'Missing PadLock dependency');
    assert(ctrlProx, 'Missing ControlProxy dependency');
    this.padLock = padLock;
    this.ctrlProx = ctrlProx;
  }
  /**
   * Method to execute command contained by req.path and send back results
   * @param {Request} req
   * @param {Response} res
   */
  executeCommand(req, res) {
    const method = this.parseMethodNameString(req.path);
    if (this.isConnectionReady(res) && this.isLockSetUp(method, req, res)) {
      if (!method.startsWith('Get')) {
        log.debug(`${req.session.personid} => ${method}` + (req.body.type ? ` (${req.body.type})` : ''));
      }
      this.ctrlProx[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504));
    }
  }

  /**
   * Method to execute specified command return results
   * @param {String} path
   * @return {Promise}
   */
  getAliECSInfo() {
    return new Promise((resolve, reject) => {
      const method = this.parseMethodNameString('GetFrameworkInfo');
      if (this.ctrlProx.connectionReady) {
        this.ctrlProx[method]()
          .then((response) => {
            response.version = this.parseAliEcsVersion(response.version);
            resolve(response);
          })
          .catch((error) => reject(new Error(error)));
      } else {
        let error = 'Could not establish connection to AliECS Core';
        if (this.ctrlProx.connectionError && this.ctrlProx.connectionError.message) {
          error = this.ctrlProx.connectionError.message;
        }
        reject(new Error(error));
      }
    });
  }

  /**
  * Method to check provided options for command and execute it through AliECS-Core
  * @param {Request} req
  * @param {Response} res
  */
  executeRocCommand(req, res) {
    res.status(502);
    res.send({message: 'ROC-CONFIG - not supported yet'});
  }

  /**
   * Method to check if control-core connection is up and running
   * @param {Response} res
   * @return {boolean}
   */
  isConnectionReady(res) {
    if (!this.ctrlProx.connectionReady) {
      let error = 'Could not establish connection to AliECS Core';
      if (this.ctrlProx.connectionError && this.ctrlProx.connectionError.message) {
        error = this.ctrlProx.connectionError.message;
      }
      errorHandler(error, res, 503);
      return false;
    }
    return true;
  }

  /**
   * Method to check if lock is needed and if yes acquired
   * @param {string} method
   * @param {Request} req
   * @param {Response} res
   * @return {boolean}
   */
  isLockSetUp(method, req, res) {
    // disallow 'not-Get' methods if not owning the lock
    if (!method.startsWith('Get') && method !== 'ListRepos') {
      if (this.padLock.lockedBy == null) {
        errorHandler(`Control is not locked`, res, 403);
        return false;
      }
      if (req.session.personid != this.padLock.lockedBy) {
        errorHandler(`Control is locked by ${this.padLock.lockedByName}`, res, 403);
        return false;
      }
    }
    return true;
  }

  /**
   * Helpers
   */

  /**
   * Method to remove `/` if exists from method name
   * @param {string} method
   * @return {string}
   */
  parseMethodNameString(method) {
    if (method && method.indexOf('/') === 0) {
      return method.substring(1, method.length);
    } else {
      return method;
    }
  }

  /**
   * Parse the JSON of the version and return it as a string
   * @param {JSON} versionJSON
   * @return {string}
   */
  parseAliEcsVersion(versionJSON) {
    let version = '';
    if (versionJSON.productName) {
      version += versionJSON.productName;
    }
    if (versionJSON.versionStr) {
      version += ' ' + versionJSON.versionStr;
    }
    if (versionJSON.build) {
      version += ' (revision ' + versionJSON.build + ')';
    }
    return version;
  }
}

module.exports = ControlService;
