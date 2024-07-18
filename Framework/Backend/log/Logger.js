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

const WinstonWrapper = require('./WinstonWrapper.js');
const InfoLoggerSender = require('./InfoLoggerSender.js');
const InfoLoggerMessage = require('./InfoLoggerMessage.js');

/**
 * @type {WinstonWrapper}
 */
let winston = null;
/**
 * @type {InfoLoggerSender}
 */
let infologger = null;

/**
 * Handles logging, prints out in console, saves to file or sends to central InfoLogger instance
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class Logger {
  /**
   * Sets the label and constructs default winston instance
   * @constructor
   * @param {string} label - the name of the module/library injecting the message
   */
  constructor(label = '') {
    this.label = label;
    if (!winston) {
      winston = new WinstonWrapper();
      winston.instance.info({message: 'Default console logger instantiated', label});
    }
  }

  /**
   * Method to allow clients to configure Log instance to make use:
   * * WinstonWrapper together with a file
   * * InfoLoggerSender
   * @param {object} [config] - object expected to contain winston and infoLoggerSender configurations
   */
  static configure(config) {
    if (config?.winston) {
      winston = new WinstonWrapper(config.winston);
    }
    if (config?.infologger) {
      infologger = new InfoLoggerSender(winston.instance);
    }
  }

  /**
   * Debug severity log
   * @param {string} log - log message
   */
  debug(log) {
    winston.instance.debug({message: log, label: this.label});
  }

  /**
   * Information severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {JSON} log - fields require for building InfoLoggerMessage
   */
  infoMessage(message, {level, system, facility, partition, run, errorSource}) {
    winston.instance.info({message, label: this.label});

    const log = InfoLoggerMessage.fromJSON({
      severity: 'Info',
      message, level, system, facility, partition, run, errorSource,
    });
    infologger?.sendMessage(log);
  }

  /**
   * @deprecated
   * Information severity log
   * @param {string} log - log message
   * @param {number} level - defaults to 11 for "developer"
   */
  info(log, level = 11) {
    winston.instance.info({message: log, label: this.label});

    infologger?.send(log, 'Info', this.label, level);
  }

  /**
   * Warning severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {JSON} log - fields require for building InfoLoggerMessage
   */
  warnMessage(message, {level, system, facility, partition, run, errorSource}) {
    winston.instance.warn({message, label: this.label});

    const log = InfoLoggerMessage.fromJSON({
      severity: 'Warning',
      message, level, system, facility, partition, run, errorSource,
    });
    infologger?.sendMessage(log);
  }

  /**
   * @deprecated
   * Warning severity log
   * @param {string} log - log message
   * @param {number} level - defaults to 11 for "developer"
   */
  warn(log, level = 11) {
    winston.instance.warn({message: log, label: this.label});

    infologger?.send(log, 'Warning', this.label, level);
  }

  /**
   * Error severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {JSON} log - fields require for building InfoLoggerMessage
   */
  errorMessage(message, {level, system, facility, partition, run, errorSource}) {
    winston.instance.error({message, label: this.label});

    const log = InfoLoggerMessage.fromJSON({
      severity: 'Error',
      message, level, system, facility, partition, run, errorSource,
    });
    infologger?.sendMessage(log);
  }

  /**
   * @deprecated
   * Error severity log
   * @param {string} log - log message
   * @param {number} level - defaults to 11 for "developer"
   */
  error(log, level = 11) {
    winston.instance.error({message: log, label: this.label});

    infologger?.send(log, 'Error', this.label, level);
  }

  /**
   * Outputs a stack trace on an object with a level of "verbose"
   * @param {Error} error - error with stack field
   */
  trace(error) {
    winston.instance.verbose({message: error.stack, label: this.label});
  }
}

module.exports.Logger = Logger;
