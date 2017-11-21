const Winston = require('./winston.js');
const InfoLogger = require('./infologger.js');

let winston = null;
let infologger = null;

exports.configure = function(config) {
  if (!winston && config.winston) {
    winston = new Winston(config.winston);
  }
  if (infologger && config.infologger) {
    infologger = new InfoLogger(config.infologger);
  }
};

exports.debug = function(log) {
  if (winston) {
    winston.instance.log('debug', log);
  }
  if (infologger) {
    infologger.debug(log);
  }
};

exports.error = function(log) {
  if (winston) {
    winston.instance.log('error', log);
  }
};
