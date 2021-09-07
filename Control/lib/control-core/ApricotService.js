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

const assert = require('assert');
const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'cog'}/apricotservice`);
const {errorHandler} = require('./../utils.js');
const CoreUtils = require('./CoreUtils.js');

/**
 * Gateway for all Apricot - Core calls
 */
class ApricotService {
  /**
   * Constructor initializing dependencies
   * @param {GrpcProxy} apricotProxy
   */
  constructor(apricotProxy) {
    assert(apricotProxy, 'Missing GrpcProxy dependency for Apricot');
    this.apricotProxy = apricotProxy;
  }

  /**
   * Method to execute command contained by req.path and send back results
   * @param {Request} req
   * @param {Response} res
   */
  executeCommand(req, res) {
    const method = CoreUtils.parseMethodNameString(req.path);
    if (this.apricotProxy?.isConnectionReady && method) {
      if (!method.startsWith('Get')) {
        const type = req.body.type ? ` (${req.body.type})` : '';
        log.info(`${req.session.personid} => ${method} ${type}`, 6);
      }
      this.apricotProxy[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504));
    } else {
      const error = this.apricotProxy?.connectionError?.message
        ?? 'Could not establish connection to AliECS Core due to pontentially undefined method';
      errorHandler(error, res, 503);
    }
  }
}

module.exports = ApricotService;
