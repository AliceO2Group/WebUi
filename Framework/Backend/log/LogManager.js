const WinstonWrapper = require('./WinstonWrapper');
const InfoLoggerSender = require('./InfoLoggerSender');
const { Logger } = require('./Logger');

/**
 * Utility class for logging
 */
class LogManager {
  /**
   * @type {WinstonWrapper}
   * @private
   */
  static _winston = null;

  /**
   * @type {InfoLoggerSender}
   * @private
   */
  static _infologger = null;

  /**
   * Method to allow clients to configure Log instance to make use:
   * * WinstonWrapper together with a file
   * * InfoLoggerSender
   * @param {object} config - object expected to contain winston and infoLoggerSender configurations
   */
  static configure(config) {
    if (config?.winston) {
      LogManager._winston = new WinstonWrapper(config.winston);
    }
    if (config?.infologger) {
      LogManager._infologger = new InfoLoggerSender(LogManager._winston.instance);
    }
  }

  /**
   * Create a new logger instance with the given label
   *
   * @param {string} label the logger's label
   * @return {Logger} the logger instance
   */
  static getLogger(label) {
    return new Logger(label, { winston: LogManager.winston, infologger: LogManager.infologger });
  }

  /**
   * Return instance of winston wrapper, after creating it if needed
   *
   * @return {WinstonWrapper} the winston wrapper
   */
  static get winston() {
    if (!LogManager._winston) {
      LogManager._winston = new WinstonWrapper();
      LogManager._winston.instance.info({ message: 'Default console logger instantiated', label: '' });
    }
    return LogManager._winston;
  }

  /**
   * Return instance of infologger sender, after creating it if needed
   *
   * @return {InfoLoggerSender} the infologger sender instance
   */
  static get infologger() {
    if (!LogManager._infologger) {
      LogManager._infologger = new InfoLoggerSender(LogManager.winston.instance);
    }
    return LogManager._infologger;
  }
}

exports.LogManager = LogManager;

/**
 * Deprecated constructor for Log class
 * @param {string} label - the logger's label
 * @constructor
 * @deprecated use {@link LogManager.getLogger}
 */
function Log(label) {
  this.label = label;
}
Log.prototype = LogManager.getLogger('');

/**
 * Method to allow clients to configure Log instance to make use:
 * * WinstonWrapper together with a file
 * * InfoLoggerSender
 * @param {object} config - object expected to contain winston and infoLoggerSender configurations
 */
Log.configure = (config) => LogManager.configure(config);

exports.Log = Log;
