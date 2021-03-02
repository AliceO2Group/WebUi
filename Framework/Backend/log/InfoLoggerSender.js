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
const {execFile} = require("child_process");

/**
 * Sends InfoLogger logs to InfoLoggerD over UNIX named socket
 * @docs https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md
 */
class InfoLoggerSender {
  /**
   * @param {object} winston - local loging object
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
   * Send a message to InfoLogger with certain fields filled.
   * @param {string} log - log message
   * @param {string} severity - one of InfoLogger supported severities: 'Info'(default), 'Error', 'Fatal', 'Warning', 'Debug'
   * @param {string} facility - the name of the module/library injecting the message
   * @param {number} level - visibility of the message
   */
  send(log, severity = 'Info', facility = '', level = 99) {
    if (this.configured) {
      log = this._removeNewLinesAndTabs(log);
      execFile(this.path, [
        `-oSeverity=${severity}`, `-oFacility=${facility}`, `-oSystem=GUI`, `-oLevel=${level}`, `${log}`
      ], function(error, stdout, stderr) {
        if (error) {
          this.winston.debug(`Impossible to write a log to InfoLogger due to: ${error}`);
        }
        if (stderr) {
          this.winston.debug(`Impossible to write a log to InfoLogger due to: ${stderr}`);
        }
      });
    }
  }

  /**
   * Replace all occurences of new lines, tabs or groups of 4 spaces with an empty space
   * @param {String} log
   * @return {String}
   */
  _removeNewLinesAndTabs(log) {
    if (log) {
      return log.replace(/ {4}|[\t\n\r]/gm, ' ');
    }
    return '';
  }
}

module.exports = InfoLoggerSender;
