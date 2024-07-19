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
const {LogLevel} = require('./LogLevel.js');
const {LogSeverity} = require('./LogSeverity.js');

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
   * Level from which one messages will not be sent to InfoLogger
   * @type {number}
   */
  static maximumInfoLoggerLevel = LogLevel.Developer;

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
   * @param {object} config - object expected to contain winston and infoLoggerSender configurations
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
   *
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  infoMessage(message, options) {
    winston.instance.info({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.Info});
  }

  /**
   * Information severity log
   * @param {string} log - log message
   * @param {number} [level=LogLevel.Developer] - log level
   *
   * @deprecated use {@link Logger.infoMessage}
   */
  info(log, level = LogLevel.Developer) {
    this.infoMessage(log, {level});
  }

  /**
   * Warning severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  warnMessage(message, options) {
    winston.instance.warn({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.Warning});
  }

  /**
   * Warning severity log
   * @param {string} log - log message
   * @param {number} [level=LogLevel.Developer] - log level
   *
   * @deprecated use {@link Logger.warnMessage}
   */
  warn(log, level = LogLevel.Developer) {
    this.warnMessage(log, {level});
  }

  /**
   * Error severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  errorMessage(message, options) {
    winston.instance.error({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.Error});
  }

  /**
   * Error severity log
   * @param {string} log - log message
   * @param {number} [level=LogLevel.Developer] - log level
   *
   * @deprecated use {@link Logger.errorMessage}
   */
  error(log, level = LogLevel.Developer) {
    this.errorMessage(log, {level});
  }

  /**
   * Outputs a stack trace on an object with a level of "verbose"
   * @param {Error} error - error with stack field
   */
  trace(error) {
    winston.instance.verbose({message: error.stack, label: this.label});
  }

  /**
   * Send a log message to InfoLogger
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options
   */
  _sendToInfoLogger(message, options) {
    if (infologger && options && options.level < Logger.maximumInfoLoggerLevel) {
      const log = InfoLoggerMessage.fromObject({
        message,
        facility: this.label, // Use label as default facility, it might be overridden in options
        ...options
      });
      infologger.sendMessage(log);
    }
  }
}

exports.Logger = Logger;
