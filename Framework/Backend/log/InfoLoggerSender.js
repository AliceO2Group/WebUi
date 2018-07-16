const process = require('process');
const {spawn} = require('child_process');
const protocols = require('./infologger-protocols.js');

/**
 * Implements InfoLogger protocol
 */
class InfoLoggerSender {
  /**
   * @param {object} winston local loging object
   * @param {string} path path to InfoLogger client (log executable)
   */
  constructor(winston, path) {
    this.winston = winston;
    this.path = path;
  }

  /**
   * Formats an Object into protocol frame
   * @param {object} fields Object including InfoLogger protocol fields
   * @param {string} version protocol version
   * @return {string} InfoLogger protocol frame
   */
  format(fields, version = '1.4') {
    let parameters = [];
    fields.severity = fields.severity || 'D';
    fields.system = fields.system || 'Web';
    fields.facility = fields.facility || `Node ${process.version}`;
    const currentProtocol = protocols.find((protocol) => protocol.version === version);
    currentProtocol.fields.forEach((field) => {
      if (field.name == 'message') {
        return;
      }
      if (fields[field.name] && fields[field.name].constructor === field.type) {
        const name = field.name.charAt(0).toUpperCase() + field.name.substr(1);
        parameters.push(`-o${name}=${fields[field.name]}`);
      }
    });
    return parameters;
  }

  /**
   * Sends log message
   * @param {object} log message as Object
   */
  send(log) {
    let parameters = this.format(log);
    parameters.push(log.message);
    const exec = spawn(this.path, parameters);
    exec.on('close', (code) => {
      if (code !== 0) {
        this.winston.instance.error('Failed to pass a message to InfoLogger client: ' + code);
      }
    });
    exec.stdout.on('data', (data) => {
      this.winston.instance.error(data.toString());
    });
  }
}
module.exports = InfoLoggerSender;
