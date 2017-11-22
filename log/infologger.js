const InfoLoggerProtocol = require('./infologgerprotocol.js');

class InfoLogger {
  constructor() {
    this.protocol = new InfoLoggerProtocol();
  }
}
module.exports = InfoLogger;
