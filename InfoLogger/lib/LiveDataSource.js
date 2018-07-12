const net = require('net');
const EventEmitter = require('events');
const {log} = require('@aliceo2/web-ui');

const protocols = [
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

/* @class LiveDataSource
 * Connects to server
 * Stream data
 * Parse data
 * Emit row ony by one
 */

module.exports = class LiveDataSource extends EventEmitter {
  /**
   * Initialize, without connecting.
   */
  constructor() {
    super();

    // Declare properties
    this.client = null;
  }

  /**
   * Establish TCP/IP to server with {host, port} options
   * All options see https://nodejs.org/api/net.html#net_socket_connect_options_connectlistener
   * @param {Object} options - {host, port}
   */
  connect(options) {
    if (this.client) {
      return;
    }

    this.client = net.createConnection(options);
    this.client.on('data', this.onData.bind(this));

    this.client.on('connect', () => {
      log.info('Connected to infoLoggerServer');
    });

    this.client.on('end', () => {
      log.error('Connection to infoLoggerServer ended');
    });

    this.client.on('error', (error) => {
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Unable to resolve InfoLoggerServer host ${options.host}`);
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused to InfoLoggerServer ${options.host}:${options.port}`);
      }
      throw error;
    });
  }

  /**
   * Disconnect and destroy socket client
   */
  disconnect() {
    if (!this.client) {
      return;
    }

    this.client.end();
    this.client = null; // gc
  }

  /**
   * Handler for incoming data from TCP/IP socket, parse it and emit object
   * @param {string} data - blabla
   * @fires LiveDataSource#message
   */
  onData(data) {
    const message = this.parse(data.toString());

    if (!message) {
      return; // not a valid message
    }

    /**
     * Message event containing log properties
     *
     * @event LiveDataSource#message
     * @type {object}
     */
    this.emit('message', message);
  }

  /**
   * Parse an input string trame to corresponding object
   * Example of input:
   * *1.4#I##1505140368.399439#aido2db##143388#root#########test Mon Sep 11 16:32:48 CEST 2017
   * Example of output:
   * {severity: 'I', hostname: 'aido2db', ...}
   * @param {string} trame
   * @return {Object}
   */
  parse(trame) {
    // Check trame integrity (header and footer)
    if (trame[0] !== '*') {
      log.warn(`Parsing: discard uncomplete trame (length=${trame.length}), must begins with *`);
      return;
    }

    if (trame[trame.length - 1] !== '\n') {
      log.warn(`Parsing: discard uncomplete trame (length=${trame.length}), must ends with \\n`);
      return;
    }

    // Check if we support this protocol version
    const trameVersion = trame.substr(1, 3);
    const trameProtocol = protocols.find((protocol) => protocol.version === trameVersion);
    if (!trameProtocol) {
      const protocolsVersions = protocols.map((protocol) => protocol.version);
      log.warn(`Parsing: unreconized protocol, found "${trameVersion}",
        support ${protocolsVersions.join(', ')}`);
      return;
    }

    // Get trame content by removing the protocol's header and footer
    const content = trame.substr(5, trame.length - 5 - 2);
    const fields = content.split('#');

    // Check trame integrity (number of fields)
    if (fields.length !== trameProtocol.fields.length) {
      log.warn(`Parsing: expected ${trameProtocol.fields.length} fields for
        protocol version ${trameProtocol.version}, found ${fields.length}`);
      return;
    }

    // Parse message
    const message = {};
    trameProtocol.fields.forEach((fieldDefinition, i) => {
      if (fieldDefinition.type === Number) {
        message[fieldDefinition.name] = parseInt(fields[i], 10);
      } else {
        message[fieldDefinition.name] = fields[i];
      }
    });

    return message;
  }
};
