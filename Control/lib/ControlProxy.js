// Doc: https://grpc.io/grpc/node/grpc.html
const grpc = require('grpc');
const path = require('path');

const {log} = require('@aliceo2/web-ui');

const PROTO_PATH = path.join(__dirname, '../protobuf/octlserver.proto');
const TIMEOUT_READY = 2000; // ms

/**
 * Encapsulate gRPC calls to O2 Control
 */
class ControlProxy {
  /**
   * Create gRPC client
   * https://grpc.io/grpc/node/grpc.Client.html
   * @param {Object} config - Contains `hostname` and `port`
   * @param {Object} config.hostname -
   * @param {Object} config.port -
   * @param {Object} config.timeout - used for gRPC deadline, in ms
   */
  constructor(config) {
    this.config = config;

    let octlProto;
    try {
      octlProto = grpc.load(PROTO_PATH, 'proto', {convertFieldsToCamelCase: true});
    } catch (error) {
      log.error(`Unable to init gRPC from proto file`);
      throw error;
    }

    this.connectionReady = false;
    this.connectionError = null;

    const address = `${config.hostname}:${config.port}`;
    const credentials = grpc.credentials.createInsecure();
    this.client = new octlProto.octl.Octl(address, credentials);
    this.client.waitForReady(Date.now() + TIMEOUT_READY, (error) => {
      if (error) {
        throw error;
      }
      log.debug(`gRPC connected to ${address}`);
    });

    this._setupControlMethod('getRoles');
    this._setupControlMethod('getFrameworkInfo');
    this._setupControlMethod('getEnvironments');
    this._setupControlMethod('getEnvironment');
    this._setupControlMethod('newEnvironment');
    this._setupControlMethod('controlEnvironment');
    this._setupControlMethod('destroyEnvironment');
  }

  /**
   * Private. Bind an exposed gRPC service to the current object,
   * promisify it and add default options like deadline.
   * @param {string} methodName - gRPC method to be added to `this`
   */
  _setupControlMethod(methodName) {
    this[methodName] = (args) => {
      args = args || {};
      const options = {
        deadline: Date.now() + this.config.timeout
      };

      return new Promise((resolve, reject) => {
        this.client[methodName](args, options, (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        });
      });
    };
  }
}

module.exports = ControlProxy;
