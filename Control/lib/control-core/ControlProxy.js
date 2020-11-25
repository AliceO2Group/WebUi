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

// Doc: https://grpc.io/grpc/node/grpc.html
const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('grpc');
const path = require('path');

const log = new (require('@aliceo2/web-ui').Log)('gRPC');

const PROTO_PATH = path.join(__dirname, './../../protobuf/o2control.proto');

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
    if (!config.hostname) {
      log.error('Missing configuration: hostname');
    }
    if (!config.port) {
      log.error('Missing configuration: port');
    }
    if (!config.timeout) {
      config.timeout = 2000;
    }

    this.config = config;

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: false, // change to camel case
      arrays: true
    });
    const octlProto = grpcLibrary.loadPackageDefinition(packageDefinition);

    this.connectionReady = false;
    this.connectionError = null;

    const address = `${config.hostname}:${config.port}`;
    const credentials = grpcLibrary.credentials.createInsecure();
    this.client = new octlProto.o2control.Control(address, credentials);
    this.client.waitForReady(Date.now() + config.timeout, (error) => {
      if (error) {
        log.error(`Connection to gRPC server (${address}) timedout`);
        log.error(error.message);
        this.connectionError = error;
      } else {
        log.info(`gRPC connected to ${address}`);
        this.connectionReady = true;
      }
    });

    // set all the available gRPC methods
    this.methods = Object.keys(octlProto.o2control.Control.prototype).filter((item) => {
      return !(item.charAt(0) == '$');
    });

    for (const method of this.methods) {
      this._setupControlMethod(method);
    }
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
