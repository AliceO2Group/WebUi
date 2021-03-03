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

const log = new (require('@aliceo2/web-ui').Log)('COG');
/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (err.stack) {
    log.trace(err);
  }
  log.error(err.message || err);
  res.status(status);
  res.send({message: err.message || err});
}

/**
 * Global Error Logger for AliECS GUI
 * @param {Error} err 
 */
function errorLogger(err) {
  if (err.stack) {
    log.trace(err);
  }
  log.error(err.message || err);
}

module.exports = {errorHandler, errorLogger};
