/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const net = require('net');
const EventEmitter = require('events');
const log = new (require('./Log.js'))('InfoLoggerReceiver');

const protocols = require('./infologger-protocols.js');

/* @class InfoLoggerReceiver
 * Connects to server
 * Stream data
 * Parse data
 * Emit row ony by one
 */

module.exports = class InfoLoggerReceiver extends EventEmitter {
  /**
   * Initialize, without connecting.
   */
  constructor() {
    super();

    // Declare properties
    this.client = null;
    this.buffer = '';

    this.isConnected = false;
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

    this.host = options.host;
    this.port = options.port;

    this.client = net.createConnection(options);
    this.client.on('data', (messages) => this.onData(messages));

    this.client.on('connect', () => {
      this.isConnected = true;
      this.emit('connected');
      log.info(`Connected to infoLoggerServer ${options.host}:${options.port}`);
    });

    this.client.on('end', () => {
      log.error('Connection to infoLoggerServer ended (FIN)');
      this.isConnected = false;
      this.emit('close');
      setTimeout(() => {
        log.info('Quickly reconnecting infoLoggerServer socket...');
        this.client.connect(this.port, this.host);
      }, 5000);
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      log.error(`Failed to connect to infoLoggerServer ${this.host}:${this.port} - ${error.code}`);
      setTimeout(() => {
        this.emit('connection-issue', 'Unable to connect to InfoLogger Server. Retrying in 5 seconds...');
        log.info('Reconnecting infoLoggerServer socket...');
        this.client.connect(this.port, this.host);
      }, 5000);
    });
  }

  /**
   * Disconnect and destroy socket client
   */
  disconnect() {
    if (!this.client) {
      return;
    }
    this.isConnected = false;
    this.client.end();
    this.client = null; // gc
  }

  /**
   * Handler for incoming data from TCP/IP socket, parse it and emit object
   * @param {string} data - blabla
   * @fires LiveDataSource#message
   */
  onData(data) {
    let dataString = this.buffer + data.toString();
    this.buffer = '';
    // detect whether the last log is chopped in the middle
    if (dataString[dataString.length - 1] !== '\n') {
      const indexLast = dataString.lastIndexOf('\n');
      this.buffer = dataString.substring(indexLast);
      dataString = dataString.substring(0, indexLast);
    }
    const messages = dataString.split('\n');

    for (const message of messages) {
      if (!message) {
        continue;
      }
      /**
      * Message event containing log properties
      *
      * @event LiveDataSource#message
      * @type {object}
      */
      this.emit('message', this.parse(message + '\n'));
    }
  }

  /**
   * Parse an input string frame to corresponding object
   * Empty fields are ignored.
   * Example of input:
   * *1.4#I##1505140368.399439#aido2db##143388#root#########test Mon Sep 11 16:32:48 CEST 2017
   * Example of output:
   * {severity: 'I', hostname: 'aido2db', ...}
   * @param {string} frame
   * @return {Object}
   */
  parse(frame) {
    // Check frame integrity (header and footer)
    if (frame[0] !== '*') {
      log.warn(`Parsing: discard uncomplete frame (length=${frame.length}), must begins with *`);
      return;
    }

    if (frame[frame.length - 1] !== '\n') {
      log.warn(`Parsing: discard uncomplete frame (length=${frame.length}), must ends with \\n`);
      return;
    }

    // Check if we support this protocol version
    const frameVersion = frame.substr(1, 3);
    const frameProtocol = protocols.find((protocol) => protocol.version === frameVersion);
    if (!frameProtocol) {
      const protocolsVersions = protocols.map((protocol) => protocol.version);
      log.warn(`Parsing: unreconized protocol, found "${frameVersion}",
        support ${protocolsVersions.join(', ')}`);
      return;
    }

    // Get frame content by removing the protocol's header and footer
    const content = frame.substr(5, frame.length - 5 - 1);
    const fields = content.split('#');

    // Check frame integrity (number of fields)
    if (fields.length !== frameProtocol.fields.length) {
      log.warn(`Parsing: expected ${frameProtocol.fields.length} fields for
        protocol version ${frameProtocol.version}, found ${fields.length}`);
      return;
    }

    // Parse message
    const message = {};
    frameProtocol.fields.forEach((fieldDefinition, i) => {
      if (fields[i] === '') {
        return;
      } else if (fieldDefinition.type === Number) {
        message[fieldDefinition.name] = parseFloat(fields[i]);
      } else {
        message[fieldDefinition.name] = fields[i];
      }
    });

    return message;
  }
};
