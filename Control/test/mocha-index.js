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

/* eslint-disable no-invalid-this */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
const {spawn} = require('child_process');
const path = require('path');

// Doc: https://grpc.io/grpc/node/grpc.html
const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('@grpc/grpc-js');

const PROTO_PATH = path.join(__dirname, '../protobuf/o2control.proto');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

let page;
describe('Control', function() {
  let browser;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(25000);
  this.slow(1000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  let calls = {}; // Object.<string:method, bool:flag> memorize that gRPC methods have been called indeed
  const envTest = {
    environment: {
      id: '6f6d6387-6577-11e8-993a-f07959157220',
      createdWhen: '2018-06-01 10:40:27.97536195 +0200 CEST',
      state: 'CONFIGURED',
      tasks: [],
      rootRole: 'copy-push'
    },
    workflow: {},
    workflowTemplates: {
      workflowTemplates: [
        {repo: 'git.cern.ch/some-user/some-repo/', template: 'prettyreadout-1', revision: 'master'},
        {repo: 'git.cern.ch/some-user/some-repo/', template: 'prettyreadout-1', revision: 'dev'},
      ]
    },
    listRepos: {
      repos: [
        {name: 'git.cern.ch/some-user/some-repo/', default: true, defaultRevision: 'dev'},
        {name: 'git.com/alice-user/alice-repo/'}]
    }
  };
  let refreshCall = 0;
  before(async () => {
    // Start gRPC server, this replaces the real Control server written in Go.
    const server = new grpcLibrary.Server();
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: false, // change to camel case
    });
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
            envTest.environment.state = 'STANDBY';
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
      }
    });

    const bindCallback = (error, _) => {
      if (error) {
        this.ok = false;
        console.error(error);
        throw error;
      } else {
        server.start();
      }

    };
    server.bindAsync(address, credentials, bindCallback);


    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    this.ok = true;

    // Start browser to test UI
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true});
    page = await browser.newPage();

    // Listen to browser
    page.on('error', (pageerror) => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('pageerror', (pageerror) => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('console', (msg) => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`        ${msg.args()[i]}`);
      }
    });
    exports.page = page;
    const helpers = {
      url: url,
      calls: calls
    };
    exports.helpers = helpers;
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, {waitUntil: 'networkidle0'});
        break; // conneciton ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=environments"', async () => {
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=environments');
  });

  require('./public/page-about-mocha');
  require('./public/page-environment-mocha');
  require('./public/page-environments-mocha');
  require('./public/page-new-environment-mocha');
  // require('./public/page-configuration-mocha');

  beforeEach(() => {
    this.ok = true;
  });

  afterEach(() => {
    if (!this.ok) {
      throw new Error('something went wrong');
    }
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log('---------------------------------------------');
    console.log(subprocessOutput);
    subprocess.kill();
  });
});
