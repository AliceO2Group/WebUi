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

import { LogManager } from '@aliceo2/web-ui';
const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/utils`);

/**
 * Global HTTP error handler, sends status 500
 * @param {string} errToLog - Error for qcg own logs
 * @param {string} errToSend - Error to be stored in InfoLogger for user investigation
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 * @param {string} facility - service that sends the log
 * @returns {void}
 */
export function errorHandler(errToLog, errToSend, res, status = 500, facility = 'utils') {
  errorLogger(errToLog, facility);
  res.status(status).send({ message: errToSend.message || errToSend });
}

/**
 * Global Error Logger for AliECS GUI
 * @param {Error} err - error that should be logged
 * @param {string} facility - service that sends the log
 * @returns {void}
 */
export function errorLogger(err, facility = 'utils') {
  logger.facility = `${process.env.npm_config_log_label ?? 'qcg'}/${facility}`;
  if (err.stack) {
    logger.trace(err);
  }
  logger.error(err.message || err);
}
