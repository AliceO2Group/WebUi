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
/* eslint-disable require-jsdoc */

const path = require('path');

// Doc: https://grpc.io/grpc/node/grpc.html
const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('@grpc/grpc-js');
const {getWebUiProtoIncludeDir} = require('@aliceo2/web-ui');

const PROTO_PATH = path.join(__dirname, './../../protobuf/o2apricot.proto');

/**
 * Create and run a mock gRPC server for Apricot Service
 */
const apricotGRPCServer = (config) => {
  let calls = {};

  const server = new grpcLibrary.Server();
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {keepCase: false, includeDirs: [getWebUiProtoIncludeDir()]}); // change to camel case
  const octlProto = grpcLibrary.loadPackageDefinition(packageDefinition);
  const credentials = grpcLibrary.ServerCredentials.createInsecure();
  const address = `${config.apricot.hostname}:${config.apricot.port}`;
  server.addService(octlProto.apricot.Apricot.service, {
    listDetectors(call, callback) {
      calls['listDetectors'] = true;
      callback(null, {detectors: ['MID', 'DCS', 'ODC']});
    },
    getHostInventory(call, callback) {
      calls['getHostInventory'] = true;
      callback(null, {hosts: ['ali-flp-22', 'ali-flp-23']});
    },
    setRuntimeEntry(call, callback) {
      calls['setRuntimeEntry'] = true;
      callback(null, {});
    },
    listRuntimeEntries(call, callback) {
      calls['listRuntimeEntries'] = true;
      callback(null, {payload: ['config1', 'config2']});
    },
  });

  const bindCallback = (error, _) => {
    if (error) {
      console.error(error);
      throw error;
    }
  };
  server.bindAsync(address, credentials, bindCallback);
  return {server, calls};
};

module.exports = {apricotGRPCServer};