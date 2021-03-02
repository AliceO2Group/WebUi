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

const Winston = require('./winston.js');
const InfoLoggerSender = require('./InfoLoggerSender.js');

let winston = null;
let infologger = null;

/**
 * Handles loging, prints out in console, saves to file or sends to cerntral InfoLogger instance
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class Log {
  /**
   * Sets the facility and constructs default winston instance
   * @constructor
   * @param {string} facility - the name of the module/library injecting the message
   * @param {string} system - the name of the system running the process
   */
  constructor(facility = '', system = 'GUI') {
    this.facility = facility;
    this.system = system;
    if (!winston) {
      winston = new Winston();
      winston.instance.debug('Created default instance of console logger');
    }
    if (!infologger) {
      infologger = new InfoLoggerSender(winston, this.system);
    }
  }

  /**
   * Configures Winston instance
   * @param {object} config
   */
  static configure(config) {
    if (config && config.winston) {
      winston = new Winston(config.winston);
    }
  }

  /**
   * Debug severity log
   * @param {string} log - log message
   */
  debug(log) {
    const message = (!this.facility) ? log : {message: log, facility: this.facility};
    winston.instance.debug(message);
  }

  /**
   * Information severity log
   * @param {string} log - log message
   * @param {number} level - defaults to 11 for "developer"
   */
  info(log, level = 11) {
    const message = (!this.facility) ? log : {message: log, facility: this.facility};
    winston.instance.info(message);

    infologger.send(log, 'Info', this.facility, level);
  }

  /**
   * Warning severity log
   * @param {string} log - log message
   * @param {number} level - defaults to 11 for "developer"
   */
  warn(log, level = 11) {
    const message = (!this.facility) ? log : {message: log, facility: this.facility};
    winston.instance.warn(message);

    infologger.send(log, 'Warning', this.facility, level);
  }

  /**
   * Error severity log
   * @param {string} log - log message
   * @param {number} level - defaults to 11 for "developer"
   */
  error(log, level = 11) {
    const message = (!this.facility) ? log : {message: log, facility: this.facility};
    winston.instance.error(message);

    infologger.send(log, 'Error', this.facility, level);
  }

  /**
   * Outputs a stack trace on an object
   * @param {object} err - any object
   */
  trace(err) {
    // eslint-disable-next-line
    console.trace(err);
  }
}

module.exports = Log;
