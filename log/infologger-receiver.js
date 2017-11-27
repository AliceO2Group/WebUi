const net = require('net');
const EventEmitter = require('events');
const protocols = require('./infologger-protocols.js').protocols;

/**
 * Implements InfoLogger protocol
 */
class InfoLoggerReceiver extends EventEmitter {
  /**
   * @param {object} winston local loging object
   */
  constructor(winston) {
    super();
    this.winston = winston;
  }

  /**
   * Connects to InfoLogger server or deamon (TCP socket)
   * @param {object} options TCP options according to net package
   */
  connect(options) {
    if (this.client) {
      return;
    }

    this.client = net.createConnection(options);
    this.client.on('data', (data) => this.onmessage(data.toString()));

    this.client.on('connect', () => {
      this.winston.instance.info(
        `Connected to infoLoggerServer: ${options.host} : ${options.port}`
      );
    });

    this.client.on('end', () => {
      this.winston.instance.info('Disconnected from infoLoggerServer');
    });
  }

  /**
   * Handles frames received from InfoLogger server
   * @param {object} data InfoLogger frame
   */
  onmessage(data) {
    this.parse(data)
      .then((parsed) => {
        this.emit('message', parsed);
      }, (error) => {
        this.winston.instance.error(error.message);
      });
  }

  /**
   * Disconnection from the socket
   */
  disconnect() {
    if (!this.client) {
      return;
    }
    this.client.end();
  }

  /**
   * Parses InfoLogger protocol string into an Object
   * @param {string} frame InfoLogger frame
   * @return {object} Object including all frame fileds
   */
  parse(frame) {
    return new Promise((resolve, reject) => {
      if ((frame[0] !== '*') || (frame[frame.length - 1] !== '\n')) {
        reject(new Error('Protocol must start with * character and end withe a new line'));
      }

      const protocolVersion = frame.substr(1, 3);
      const currentProtocol = protocols.find((protocol) => protocol.version === protocolVersion);
      if (currentProtocol === undefined) {
        reject(new Error(`Unhandled protcol version: ${currentProtocol}`));
      }
      const fields = frame.substr(5, frame.length - 5 - 1).split('#');
      if (fields.length !== currentProtocol.fields.length) {
        reject(new Error(`Unexpected number of fileds: ${fields.length}`));
      }

      let message = {};
      currentProtocol.fields.forEach((field, index) => {
        if (!fields[index].trim()) {
          return;
        }
        message[field.name] = (field.type === Number) ? parseInt(fields[index], 10) : fields[index];
      });
      resolve(message);
    });
  }
}
module.exports = InfoLoggerReceiver;
