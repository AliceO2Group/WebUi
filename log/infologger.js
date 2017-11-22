const net = require('net');

const protocols = [
  {
    version: '1.3',
    fields: [
      {type: String, name: 'severity'},
      {type: Number, name: 'level'},
      {type: Number, name: 'timestamp'},
      {type: String, name: 'hostname'},
      {type: String, name: 'rolename'},
      {type: Number, name: 'pid'},
      {type: String, name: 'username'},
      {type: String, name: 'system'},
      {type: String, name: 'facility'},
      {type: String, name: 'detector'},
      {type: String, name: 'partition'},
      {type: String, name: 'dest'},
      {type: Number, name: 'run'},
      {type: Number, name: 'errcode'},
      {type: Number, name: 'errline'},
      {type: String, name: 'errsource'},
      {type: String, name: 'message'}
    ]
  },
  {
    version: '1.4',
    fields: [
      {name: 'severity', type: String},
      {name: 'level', type: Number},
      {name: 'timestamp', type: String},
      {name: 'hostname', type: String},
      {name: 'rolename', type: String},
      {name: 'pid', type: Number},
      {name: 'username', type: String},
      {name: 'system', type: String},
      {name: 'facility', type: String},
      {name: 'detector', type: String},
      {name: 'partition', type: String},
      {name: 'run', type: Number},
      {name: 'errcode', type: Number},
      {name: 'errline', type: Number},
      {name: 'errsource', type: String},
      {name: 'message', type: String}
    ]
  }
];

/**
 * Implements InfoLogger protocol
 */
class InfoLogger {
  /**
   * @param {object} winston local loging object
   */
  constructor(winston) {
    this.winston = winston;
  }

  /**
   * Formats an Object into protocol frame
   * @param {object} fields Object including InfoLogger protocol fields
   * @param {string} version protocol version
   * @return {string} InfoLogger protocol frame
   */
  format(fields, version = '1.4') {
    let message = '*' + version;
    protocols[version].fields.forEach((field) => {
      message += '#';
      if (field.type == typeof fields[field.name]) {
        message += fields[field.name];
      }
    });
    return message;
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
      this.winston.instance.info('Connected to infoLoggerServer.');
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
      // emit or callback
      }, (error) => {
        this.winston.instance.error(error.message);
      });
  }

  /**
   * Sends log message
   * @param {object} log message as Object
   */
  send(log) {
    const frame = this.format(log);
    this.client.write(frame);
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

      const fields = frame.substr(5, frame.length - 5 - 2).split('#');
      if (fields.length !== currentProtocol.fields.length) {
        reject(new Error(`Unexpected number of fileds: ${fields.length}`));
      }

      let message = {};
      currentProtocol.fields.forEach((field, index) => {
        message[field.name] = field.type === Number ? parseInt(fields[index], 10) : fields[index];
      });
      resolve(message);
    });
  }
}
module.exports = InfoLogger;
