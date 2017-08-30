const winston = require('winston');
const config = require('./config.json');

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(
      {timestamp: true, colorize: true, level: config.log.console}
    ),
    new winston.transports.File(
      {filename: './error.log', level: config.log.file}
    )
  ],
  exitOnError: true
});
