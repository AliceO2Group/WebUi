const EventEmitter = require('events');

const ZeroMQClient = require('@aliceo2/web-ui').ZeroMQClient;

const ZMQ_TIMEOUT = 2000; // ms, should take ~10ms

/**
 * Connect to a TObject2Json server and send requests though TCP/IP
 * and receive responses asynchronously (multiplexing).
 */
class TObject2JsonClient extends EventEmitter {
  /**
   * Connects to remote TObject2Json server and listen to it
   * @param {Object} config - {host, port}
   */
  constructor(config) {
    super();
    this.zmqClient = new ZeroMQClient(
      config.host,
      config.port,
      'dealer'
    );

    this.zmqClient.on('message', this._onRawMessage.bind(this));
  }

  /**
   * Parse incoming text message and emit json one.
   * @param {string} rawMessage
   * @fires TObject2JsonClient#message
   */
  _onRawMessage(rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch (e) {
      throw new Error('Failed to parse object from TObject2Json: ' + e);
    }

    this.emit('message', message);
  }

  /**
   * Get ROOT object'json according to its path
   * @param {string} path - object's path (agentName/objectName)
   * @return {Promise<Object>} The root data
   */
  retrieve(path) {
    this.zmqClient.send(path);

    return new Promise((resolve, fail) => {
      const timer = setTimeout(() => {
        fail('Timeout loading object from TObject2Json');
      }, ZMQ_TIMEOUT);

      const handler = (message) => {
        if (message.request && message.request === path) {
          clearTimeout(timer);
          this.removeListener('message', handler);
          resolve(message.payload);
        }
      };

      this.on('message', handler);
    });
  }
}

module.exports = TObject2JsonClient;
