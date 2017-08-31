const winston = require('winston');
const config = {
  "console": "debug",
  "file": "error"
}


module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(
      {timestamp: true, colorize: true, level: config.console}
    ),
    new winston.transports.File(
      {filename: './error.log', level: config.file}
    )
  ],
  exitOnError: true
});
