const winston = require('winston');

class Winston {
  constructor(config) {
    const consoleFormat = winston.format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    });

  
    this.instance = winston.createLogger({
      transports: [
        new (winston.transports.Console)(
          {level: config.consoleLvl,
           format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), consoleFormat)}
        ),  
        new winston.transports.File(
          {filename: config.file, level: config.fileLvl}
        )   
      ],  
      exitOnError: true
    });  
  }
}
module.exports = Winston;
