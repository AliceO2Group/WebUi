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

// Doc: https://grpc.io/docs/languages/node/
const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('@grpc/grpc-js');
const path = require('path');
const {grpcErrorToNativeError} = require('./../errors/grpcErrorToNativeError.js');
const {Status} = require(path.join(__dirname, './../../protobuf/status_pb.js'));
const {EnvironmentInfo} = require(path.join(__dirname, './../../protobuf/environmentinfo_pb.js'));
const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'cog'}/grpcproxy`);

/**
 * Encapsulate gRPC calls
 */
class GrpcProxy {
  /**
   * Create gRPC client and sets the methods identified in the provided path of protofile
   * https://grpc.io/grpc/node/grpc.Client.html
   * @param {Object} config - Contains configuration fields for gRPC client
   * @param {string} path - path to protofile location
   * @param {boolean} wasInError - parameter to define if the connection is done following a failed attempt, thus logs are silent
   */
  constructor(config, path, wasInError = false) {
    if (this._isConfigurationValid(config, path)) {
      const packageDefinition = protoLoader.loadSync(path, {longs: String, keepCase: false, arrays: true});
      const octlProto = grpcLibrary.loadPackageDefinition(packageDefinition);
      const protoService = octlProto[this._package][this._label];
      const address = `${config.hostname}:${config.port}`;
      const credentials = grpcLibrary.credentials.createInsecure();
      const options = {'grpc.max_receive_message_length': 1024 * 1024 * this._maxMessageLength}; // MB

      this.client = new protoService(address, credentials, options);
      this.client.waitForReady(Date.now() + this._connectionTimeout,
        (error) => this._logConnectionResponse(error, wasInError, address));

      // set all the available gRPC methods in object and build a separate array with names only
      console.log(Object.keys(protoService.prototype))
      this.methods = Object.keys(protoService.prototype)
        .filter((item) => item.charAt(0) !== '$')
        .map((method) => this._getAndSetPromisfiedMethod(method));
    }
  }

  /**
   * Private. Bind an exposed gRPC service to the current object,
   * promisify it and add default options like deadline.
   * @param {string} methodName - gRPC method to be added to `this`
   */
  _getAndSetPromisfiedMethod(methodName) {
    /**
     * Definition of each call that can be made based on the proto file definition
     * @param {JSON} args - arguments to be passed to gRPC Server
     * @param {JSON} options - metadata for gRPC call such as deadline
     * @returns 
     */
    this[methodName] = (args = {}, options = {deadline: Date.now() + this._timeout}) => {
      return new Promise((resolve, reject) => {
        this.client[methodName](args, options, (error, response) => {
          if (error) {
            try {
              if (methodName === 'NewEnvironment' && error.metadata?.internalRepr?.has('grpc-status-details-bin')) {
                const buffer = error.metadata.get('grpc-status-details-bin')[0];
                Status.deserializeBinary(buffer).getDetailsList().map((detail) => {
                  if (detail.getTypeName() == 'o2control.EnvironmentInfo') {
                    const deserialized = detail.unpack(EnvironmentInfo.deserializeBinary, detail.getTypeName());
                    error.envId = deserialized.array[0];
                  }
                });
              }
            } catch (exception) {
              log.debug('Failed new env details error' + exception);
            }
            reject(grpcErrorToNativeError(error));
            return;
          }
          resolve(response);
        });
      });
    };
    return methodName;
  }

  /**
   * Checks if configuration provided for gRPC Connection is valid
   * @param {JSON} config
   * @param {String} path - location of gRPC file containing API
   */
  _isConfigurationValid(config, path) {
    let isValid = true;
    if (!config.hostname) {
      log.error('Missing configuration: hostname');
      isValid = false;
    }
    if (!config.port) {
      log.error('Missing configuration: port');
      isValid = false;
    }
    if (!path) {
      log.error('Missing path for gRPC API declaration');
      isValid = false;
    }
    if (!config.label) {
      log.error('Missing service label for gRPC API');
      isValid = false;
    }
    if (!config.package) {
      log.error('Missing service label for gRPC API');
      isValid = false;
    }
    this._label = config.label;
    this._package = config.package;
    this._timeout = config.timeout ?? 30000;
    this._connectionTimeout = config.connectionTimeout ?? 10000;
    this._maxMessageLength = config.maxMessageLength ?? 50;

    this._isConnectionReady = false;
    this._connectionError = null;

    return isValid;
  }

  /**
   * 
   * @param {Error} error - error following attempt to connect to gRPC server
   * @param {boolean} wasInError - flag to know if connection is attempted again after a failure; If yes, logging is disabled
   * @param {string} address - address on which connection was attempted
   */
  _logConnectionResponse(error, wasInError, address) {
    if (error) {
      if (!wasInError) {
        log.error(`Connection to ${this._label} server (${address}) timeout`);
        log.error(error.message);
      }

      this.connectionError = error;
      this.isConnectionReady = false;
    } else {
      log.info(`${this._label} gRPC connected to ${address}`);
      this.connectionError = null;
      this.isConnectionReady = true;
    }
  }

  /*
   * Getters & Setters
   */

  /**
   * Get the status of the connection to gRPC
   * @return {boolean}
   */
  get isConnectionReady() {
    return this._isConnectionReady;
  }

  /**
   * Set the status of the connection to gRPC
   * @param {boolean} connection
   */
  set isConnectionReady(connection) {
    this._isConnectionReady = connection;
  }

  /**
   * Get the error of the connection if present.
   * @return {Error}
   */
  get connectionError() {
    return this._connectionError;
  }

  /**
   * Set an error for the connection to gRPC
   * @param {Error} error
   */
  set connectionError(error) {
    this._connectionError = error;
  }
}

module.exports = GrpcProxy;
