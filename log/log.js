const Winston = require('./winston.js');
const InfoLoggerSender = require('./infologger-sender.js');

let winston = null;
let infologger = null;

exports.configure = function(config) {
  if (!winston && config.winston) {
    winston = new Winston(config.winston);
  }
  if (!infologger && config.infologger) {
    infologger = new InfoLoggerSender(winston, config.infologger.execPath);
  }
};

exports.debug = function(log) {
  if (winston) {
    winston.instance.log('debug', log);
  }
  if (infologger) {
    const logObj = {
      severity: 'E',
      message: log
    };
    infologger.send(logObj);
  }
};

exports.warn = function(log) {
  if (winston) {
    winston.instance.log('warn', log);
  }
  if (infologger) {
    const logObj = {
      severity: 'W',
      message: log
    };
    infologger.send(logObj);
  }
};

exports.info = function(log) {
  if (winston) {
    winston.instance.log('info', log);
  }
  if (infologger) {
    const logObj = {
      severity: 'I',
      message: log
    };
    infologger.send(logObj);
  }
};

exports.error = function(log) {
  if (winston) {
    winston.instance.log('error', log);
  }
  if (infologger) {
    const logObj = {
      severity: 'E',
      message: log
    };
    infologger.send(logObj);
  }
};
