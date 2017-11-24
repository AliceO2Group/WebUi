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
      message: logObj
    };
    infologger.send(log);
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
