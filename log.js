const winston = require('winston');
const config = {
  'consoleLvl': 'debug',
  'fileLvl': 'error',
  'file': './error.log'
};


module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(
      {timestamp: true, colorize: true, level: config.consoleLvl}
    ),
    new winston.transports.File(
      {filename: config.file, level: config.fileLvl}
    )
  ],
  exitOnError: true
});
