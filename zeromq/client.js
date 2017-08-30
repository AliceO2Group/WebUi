const EventEmitter = require('events');
const zmq = require('zeromq');
const log = require('./../log.js');

/**
 * ZeroMQ client that communicates with Control Master prcess via one of two supported
 * socket patterns (sub and req).
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class ZeroMQClient extends EventEmitter {
  /**
   * Connects to ZeroMQ socket and binds class methods to ZeroMQ events.
   * @param {string} ip - hostname
   * @param {number} port - port number
   * @param {bool} type - socket type, true = sub. false = req
   * @construct
   */
  constructor(ip, port, type) {
    super();

    this.connected = true;
    this.socket = zmq.socket(type);

    this.socket.on('connect', (fd, endpoint) => this.connect(endpoint));
    this.socket.on('close', (fd, endpoint) => this.disconnect(endpoint));
    this.socket.on('disconnect', (fd, endpoint) => this.disconnect(endpoint));

    this.socket.connect('tcp://' + ip + ':' + port);
    log.debug('Connecting to tcp://' + ip + ':' + port + '...');
    if (type == 'sub') {
      this.socket.subscribe('');
    }
    this.socket.on('message', (message) => this.onmessage(message));
  }

  /**
   * On-connect event handler.
   * @param {string} endpoint
   */
  connect(endpoint) {
    log.debug('ZMQ: Connected to', endpoint);
    this.connected = true;
  }

  /**
   * On-disconnect event handler.
   * @param {string} endpoint
   */
  disconnect(endpoint) {
    if (this.connected) {
      log.debug('ZMQ: Disconnected from', endpoint);
    }
    this.connected = false;
  }

  /**
   * On-message event handler.
   * @param {string} message
   */
  onmessage(message) {
    if (typeof message === 'undefined') {
      log.debug('ZMQ: Cannot send undefined message');
      return;
    }
    this.emit('message', message.toString());
  }

  /**
   * Sends message via socket.
   * @param {string} message
   */
  send(message) {
    if (!this.connected) {
      log.debug('ZMQ: Could not send message as the connection is not estabilished');
      return;
    }
    this.socket.send(message);
  }
}
module.exports = ZeroMQClient;
