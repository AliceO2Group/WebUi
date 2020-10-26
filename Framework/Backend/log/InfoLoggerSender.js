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
   */
  constructor(winston) {
    this.configured = false;
    this.winston = winston;
    // for security reasons this path is hardcoded
    this.path = '/opt/o2-InfoLogger/bin/log';
    fs.access(this.path, fs.constants.X_OK, (err) => {
      if (err) {
        winston.instance.debug('InfoLogger executable not found');
      } else {
        winston.instance.debug('Created instance of InfoLogger sender');
        this.configured = true;
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
        this.winston.debug('Impossible to write a log to InfoLogger');
      }
    });
  }
}
module.exports = InfoLoggerSender;
