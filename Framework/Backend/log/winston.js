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

    const consoleFormatter = winston.format.printf((log) => {
      if (log.hasOwnProperty('label')) {
        return `${log.timestamp} ${log.level}: [${log.label}] ${log.message}`;
      } else {
        return `${log.timestamp} ${log.level}: ${log.message}`;
      }
    });

    const transports = [
      new (winston.transports.Console)({
        level: config.consoleLvl,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          consoleFormatter
        )}
      )
    ];

    if (config.file) {
      config.fileLvl = config.fileLvl || 'info';
      transports.push(new winston.transports.File({
        filename: config.file,
        level: config.fileLvl,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.prettyPrint()
        )
      }));
    }

    this.instance = winston.createLogger({
      transports: transports,
      exitOnError: true
    });
  }
}
module.exports = Winston;
