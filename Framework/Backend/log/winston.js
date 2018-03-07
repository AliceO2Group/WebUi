const winston = require('winston');

/**
 * Creates Winston logger
 * Uses two transports file and console (if properly configured)
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class Winston {
  /** Creates two transports and constructs a logger
   * @param {object} config configuration for console and file transports
   */
  constructor(config) {
    if (!config) {
      config = {};
    }
    config.consoleLvl = config.consoleLvl || 'debug';

    const consoleFormat = winston.format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    });

    let transports = [
      new (winston.transports.Console)({
        level: config.consoleLvl,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          consoleFormat
        )}
      )
    ];

    if (config.file) {
      transports.push(new winston.transports.File(
        {filename: config.file, level: config.fileLvl}
      ));
    }

    this.instance = winston.createLogger({
      transports: transports,
      exitOnError: true
    });
  }
}
module.exports = Winston;
