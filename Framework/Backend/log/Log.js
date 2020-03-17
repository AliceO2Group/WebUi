/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
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
   * Sets the label and constructs default winston instance
   * @constructor
   * @param {string} label
   */
  constructor(label = null) {
    this.label = label;
    if (!winston) {
      winston = new Winston();
      winston.instance.warn('Created default instance of logger');
    }
  }

  /**
   * Configures Winston and InfoLogger instances
   * @param {object} config
   */
  static configure(config) {
    if (config && config.winston) {
      winston = new Winston(config.winston);
    }
    if (!infologger && config && config.infologger) {
      infologger = new InfoLoggerSender(winston, config.infologger.sender);
    }
  }

  /**
   * Debug severity log
   * @param {string} log - log message
   */
  debug(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.debug(message);

    if (infologger) {
      const logObj = {severity: 'D', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  /**
   * Information severity log
   * @param {string} log - log message
   */
  info(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.info(message);

    if (infologger) {
      const logObj = {severity: 'D', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  /**
   * Warning severity log
   * @param {string} log - log message
   */
  warn(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.warn(message);

    if (infologger) {
      const logObj = {severity: 'W', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  /**
   * Error severity log
   * @param {string} log - log message
   */
  error(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.error(message);

    if (infologger) {
      const logObj = {severity: 'E', message: log, rolename: this.label};
      infologger.send(logObj);
    }
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
