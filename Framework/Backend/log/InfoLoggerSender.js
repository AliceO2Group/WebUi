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

const fs = require('fs');
const {exec} = require("child_process");

/**
 * Sends InfoLogger logs to InfoLoggerD over UNIX named socket
 */
class InfoLoggerSender {
  /**
   * @param {object} winston local loging object
   * @param {string} path path to InfoLogger client (log executable)
   */
  constructor(winston, path) {
    this.winston = winston;
    this.path = path;
    fs.access(path, fs.constants.X_OK, (err) => {
      if (err) {
        winston.instance.error('[InfoLoggerSender] Wrong InfoLogger log executable provided');
      }
    });
  }

  /**
   * @param {string} log - log message
   * @param {string} severity - one of InfoLogger supported severities
   * @param {stsrimg} facility name - name of the module sending the log
   */
  send(log, severity, rolename) {
    const command = `${this.path} -s ${severity} -oFacility=${rolename} -oSystem=GUI "${log}"`;
    exec(command, (error) => {
      if (error) {
        this.winston.debug('[InfoLoggerSender] Impossible to write a log');
      }
    });
  }
}
module.exports = InfoLoggerSender;
