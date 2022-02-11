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

const PROTO_PATH = path.join(__dirname, './../../protobuf/o2control.proto');

/**
 * Create and run a mock gRPC server for O2Core
 */
const coreGRPCServer = (config) => {
  let refreshCall = 0;
  let calls = {};

  const server = new grpcLibrary.Server();
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {keepCase: false});// change to camel case
  const octlProto = grpcLibrary.loadPackageDefinition(packageDefinition);
  const credentials = grpcLibrary.ServerCredentials.createInsecure();
  const address = `${config.grpc.hostname}:${config.grpc.port}`;
  server.addService(octlProto.o2control.Control.service, {
    getFrameworkInfo(call, callback) {
      calls['getFrameworkInfo'] = true;
      callback(null, {fakeData: 1});
    },
    getEnvironments(call, callback) {
      calls['getEnvironments'] = true;
      const responseData = {
        frameworkId: '74917838-27cb-414d-bfcd-7e74f85d4926-0000',
        environments: [envTest.environment]
      };
      callback(null, responseData);
    },
    controlEnvironment(call, callback) {
      calls['controlEnvironment'] = true;
      switch (call.request.type) {
        case 1: // START
          envTest.environment.state = 'RUNNING';
          break;
        case 2: // STOP
          envTest.environment.state = 'CONFIGURED';
          break;
        case 3: // CONFIGURE
          envTest.environment.state = 'CONFIGURED';
          break;
        case 4: // RESET
          envTest.environment.state = 'DEPLOYED';
          break;
      }
      callback(null, {id: envTest.environment.id});
    },
    getEnvironment(call, callback) {
      calls['getEnvironment'] = true;
      callback(null, envTest);
    },
    newEnvironment(call, callback) {
      calls['newEnvironment'] = true;
      callback(null, {environment: envTest.environment});
    },
    getWorkflowTemplates(call, callback) {
      calls['getWorkflowTemplates'] = true;
      callback(null, envTest.workflowTemplates);
    },
    listRepos(call, callback) {
      calls['listRepos'] = true;
      callback(null, envTest.listRepos);
    },
    refreshRepos(call, callback) {
      calls['refreshRepos'] = true;
      if (refreshCall++ === 0) {
        callback(new Error('504: Unable to refresh repositories'), {});
      } else {
        callback(null, {});
      }
    },
    destroyEnvironment(call, callback) {
      calls['destroyEnvironment'] = true;
      callback(null, {});
    },
    getTasks(call, callback) {
      calls['getTasks'] = true;
      callback(null, {});
    },
    getActiveDetectors(call, callback) {
      calls['getActiveDetectors'] = true;
      callback(null, {detectors: ['DCS']});
    },
  });

  const bindCallback = (error, _) => {
    if (error) {
      console.error(error);
      throw error;
    } else {
      server.start();
    }

  };
  server.bindAsync(address, credentials, bindCallback);
  return {server, calls};
};


const envTest = {
  environment: {
    id: '6f6d6387-6577-11e8-993a-f07959157220',
    createdWhen: '2018-06-01 10:40:27.97536195 +0200 CEST',
    state: 'CONFIGURED',
    tasks: [],
    rootRole: 'copy-push',
    numberOfFlps: 2,
    userVars: {
      odc_enabled: 'true',
      mid_enabled: 'false',
      mid_something: 'test',
      dd_enabled: 'true',
      run_type: 'run'
    },
    vaars: {
      odc_enabled: 'true',
      mid_enabled: 'false',
      mid_something: 'test',
      dd_enabled: 'true',
      run_type: 'run'
    },
    defaults: {
      dcs_topology: 'test',
      dd_enabled: 'true',
      run_type: 'run'
    }
  },
  workflow: {},
  workflowTemplates: {
    workflowTemplates: [
      {repo: 'git.cern.ch/some-user/some-repo/', template: 'prettyreadout-1', revision: 'master'},
    ]
  },
  listRepos: {
    repos: [
      {name: 'git.cern.ch/some-user/some-repo/', default: true, defaultRevision: 'dev', revisions: ['master', 'dev']},
      {name: 'git.com/alice-user/alice-repo/'}]
  }
};
module.exports = {coreGRPCServer};