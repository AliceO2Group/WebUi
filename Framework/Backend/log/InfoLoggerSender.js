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

const {access, constants: {X_OK}} = require('fs');
const {execFile} = require('child_process');
const InfoLoggerMessage = require('./InfoLoggerMessage.js');
const {LogLevel} = require('./LogLevel.js');
const {LogSeverity} = require('./LogSeverity.js');

/**
 * Sends logs as InfoLogger objects to InfoLoggerD over UNIX named socket
 * @docs https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md
 */
class InfoLoggerSender {
  /**
   * @param {import('winston').Logger} winston - local winston instance object
   */
  constructor(winston) {
    this._isConfigured = false;
    this.winston = winston;
    const label = 'gui/infologger';

    // for security reasons this path is hardcoded
    this._PATH = '/opt/o2-InfoLogger/bin/o2-infologger-log';
    access(this._PATH, X_OK, (err) => {
      if (err) {
        this.winston.debug({message: 'InfoLogger executable not found', label});
      } else {
        this.winston.debug({message: 'Created instance of InfoLogger sender', label});
        this._isConfigured = true;
      }
    });
  }

  /**
   * Send an InfoLoggerMessage to InfoLoggerServer if configured
   * @param {InfoLoggerMessage} log - log message
   */
  sendMessage(log) {
    if (this._isConfigured) {
      execFile(this._PATH, log.getComponentsOfMessage(), (error, _, stderr) => {
        if (error) {
          this.winston.debug({
            message: `Impossible to write a log to InfoLogger due to: ${error}`,
            label: log._facility,
          });
        }
        if (stderr) {
          this.winston.debug({
            message: `Impossible to write a log to InfoLogger due to: ${stderr}`,
            label: log._facility,
          });
        }
      });
    }
  }

  /**
   * @deprecated
   * Send a message to InfoLogger with certain fields filled.
   * @param {string} log - log message
   * @param {string} severity - one of InfoLogger supported severities {@see LogSeverity}
   * @param {string} facility - the name of the module/library injecting the message
   * @param {number} level - visibility of the message {@see LogLevel}
   */
  send(log, severity = LogSeverity.INFO, facility = '', level = LogLevel.MAX) {
    if (this._isConfigured) {
      log = InfoLoggerMessage._removeNewLinesAndTabs(log);
      execFile(this._PATH, [
        `-oSeverity=${severity}`, `-oFacility=${facility}`, `-oSystem=GUI`, `-oLevel=${level}`, `${log}`,
      ], (error, _, stderr) => {
        if (error) {
          this.winston.debug({message: `Impossible to write a log to InfoLogger due to: ${error}`, label: facility});
        }
        if (stderr) {
          this.winston.debug({message: `Impossible to write a log to InfoLogger due to: ${stderr}`, label: facility});
        }
      });
    }
  }

  /**
   * Returns if InfoLoggerD service is configured
   * @returns {boolean}
   */
  get isConfigured() {
    return this._isConfigured;
  }
}

module.exports = InfoLoggerSender;
