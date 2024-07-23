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

const InfoLoggerMessage = require('./InfoLoggerMessage.js');
const {LogLevel} = require('./LogLevel.js');
const {LogSeverity} = require('./LogSeverity.js');

/**
 * Handles logging, prints out in console, saves to file or sends to central InfoLogger instance
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class Logger {
  /**
   * Level from which one messages will not be sent to InfoLogger
   * @type {number}
   */
  static maximumInfoLoggerLevel = LogLevel.DEVELOPER;

  /**
   * @constructor
   * @param {string} [label=''] - the logger's label
   * @param {object} [delegates] - delegates logger
   * @param {WinstonWrapper} [delegates.winstonWrapper] - winston wrapper
   * @param {InfoLoggerSender} [delegates.infologger] - infologger sender
   */
  constructor(label, delegates) {
    this.label = label ?? '';

    const {winston, infologger} = delegates ?? {};
    this._winston = winston;
    this._infologger = infologger;
  }

  /**
   * Debug severity log sent as InfoLoggerMessage
   *
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  debugMessage(message, options) {
    this._winston.instance.debug({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.DEBUG});
  }

  /**
   * Debug severity log
   * @param {string} log - log message
   *
   * @deprecated use {@link Logger.debugMessage}
   */
  debug(log) {
    this.debugMessage(log);
  }

  /**
   * Information severity log sent as InfoLoggerMessage
   *
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  infoMessage(message, options) {
    this._winston.instance.info({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.INFO});
  }

  /**
   * Information severity log
   * @param {string} log - log message
   * @param {number} [level=LogLevel.DEVELOPER] - log level
   *
   * @deprecated use {@link Logger.infoMessage}
   */
  info(log, level = LogLevel.DEVELOPER) {
    this.infoMessage(log, {level});
  }

  /**
   * Warning severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  warnMessage(message, options) {
    this._winston.instance.warn({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.WARNING});
  }

  /**
   * Warning severity log
   * @param {string} log - log message
   * @param {number} [level=LogLevel.DEVELOPER] - log level
   *
   * @deprecated use {@link Logger.warnMessage}
   */
  warn(log, level = LogLevel.DEVELOPER) {
    this.warnMessage(log, {level});
  }

  /**
   * Error severity log sent as InfoLoggerMessage
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options. If omitted, log will be sent to local file only
   */
  errorMessage(message, options) {
    this._winston.instance.error({message, label: this.label});

    this._sendToInfoLogger(message, {...options, severity: LogSeverity.ERROR});
  }

  /**
   * Error severity log
   * @param {string} log - log message
   * @param {number} [level=LogLevel.DEVELOPER] - log level
   *
   * @deprecated use {@link Logger.errorMessage}
   */
  error(log, level = LogLevel.DEVELOPER) {
    this.errorMessage(log, {level});
  }

  /**
   * Outputs a stack trace on an object with a level of "verbose"
   * @param {Error} error - error with stack field
   */
  trace(error) {
    this._winston.instance.verbose({message: error.stack, label: this.label});
  }

  /**
   * Send a log message to InfoLogger
   * @param {string} message - log message
   * @param {Partial<InfoLoggerMessageOptions>} [options] - log options
   */
  _sendToInfoLogger(message, options) {
    if (this._infologger && options && options.level < Logger.maximumInfoLoggerLevel) {
      const log = InfoLoggerMessage.fromObject({
        message,
        facility: this.label, // Use label as default facility, it might be overridden in options
        ...options,
      });
      this._infologger.sendMessage(log);
    }
  }
}

exports.Logger = Logger;
