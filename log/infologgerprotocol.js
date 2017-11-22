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
class InfoLoggerProtocol {
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
      if (fields.length !== currentProtocol.protocol.length) {
        reject(new Error(`Unexpected number of fileds: ${fields.length}`));
      }

      let message = {};
      currentProtocol.fileds.forEach((field, index) => {
        message[field.name] = field.type === Number ? parseInt(fields[index], 10) : fields[index];
      });
      resolve(message);
    });
  }
}
module.exports = InfoLoggerProtocol;
