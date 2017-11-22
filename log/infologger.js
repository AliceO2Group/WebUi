const net = require('net');
const EventEmitter = require('events');

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


class InfoLogger {

  connect() {
  }

  disconnect() {
  }

  send() {
  }

  parse() {
  }
}
module.exports = InfoLogger;
