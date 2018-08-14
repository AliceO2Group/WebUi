const fs = require('fs');
const Winston = require('./winston.js');
const InfoLoggerSender = require('./InfoLoggerSender.js');

let winston = null;
let infologger = null;

class Log {

  constructor(label = null) {
    this.label = label;
    if (!winston) { 
      winston = new Winston();
      winston.instance.warn('Created default instance of logger');
    }
  }

  static configure(config) {
    if (config && config.winston) {
      winston = new Winston(config.winston);
    }
    if (!infologger && config && config.infologger && fs.existsSync(config.infologger.execPath)) {
      infologger = new InfoLoggerSender(winston, config.infologger.execPath);
    }
  }

  debug(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.debug(message);

    if (infologger) {
      const logObj = {severity: 'D', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  info(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.info(message);

    if (infologger) {
      const logObj = {severity: 'D', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  warn(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.warn(message);

    if (infologger) {
      const logObj = {severity: 'W', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  error(log) {
    const message = (this.label == null) ? log : {message: log, label: this.label};
    winston.instance.error(message);

    if (infologger) {
      const logObj = {severity: 'E', message: log, rolename: this.label};
      infologger.send(logObj);
    }
  }

  static trace(err) {
    // Print more information for debugging
    // eslint-disable-next-line
    console.trace(err);
  }
}

module.exports = Log;
