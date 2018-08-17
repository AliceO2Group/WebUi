const protocols = require('./infologger-protocols.js');
const net = require('net');

/**
 * Sends InfoLogger logs to InfoLoggerD over UNIX named socket
 */
class InfoLoggerSender {
  /**
   * @param {object} winston local loging object
   * @param {string} path path to InfoLogger client (log executable)
   */
  constructor(winston, path) {
    this.winston = winston;
    this.stream = net.connect(path);
    this.stream.on('close', () => {
      winston.instance.error('[InfoLoggerSender] Connection to daemon closed');
    });
    this.stream.on('connect', () => {
      winston.instance.info('[InfoLoggerSender] Connected to daemon: ' + path);
    });
  }

  /**
   * Formats an log object into InfoLogger log frame
   * @param {object} fields log object
   * @param {string} version protocol version
   * @return {string} InfoLogger protocol frame
   */
  format(fields, version = '1.4') {
    let stringLog = '*' + version;
    fields.system = fields.system || 'Web';
    fields.facility = fields.facility || `Node ${process.version}`;
    const currentProtocol = protocols.find((protocol) => protocol.version === version);
    currentProtocol.fields.forEach((field) => {
      stringLog += '#';
      if (typeof fields[field.name] !== 'undefined') {
        stringLog += fields[field.name];
      }
    });
    return stringLog + '\n';
  }

  /**
   * Sends log message
   * @param {object} log message as Object
   */
  send(log) {
    this.stream.write(this.format(log));
  }

  /**
   * Smoothly closes the connection
   */
  close() {
    this.stream.end();
  }
}
module.exports = InfoLoggerSender;
