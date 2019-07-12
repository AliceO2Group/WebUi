/* eslint-disable require-jsdoc */
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
const {spawn} = require('child_process');
const path = require('path');

// Doc: https://grpc.io/grpc/node/grpc.html
const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('grpc');

const PROTO_PATH = path.join(__dirname, '../protobuf/o2control.proto');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('Control', function() {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(25000);
  this.slow(1000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  const calls = {}; // Object.<string:method, bool:flag> memorize that gRPC methods have been called indeed
  const envTest = {
    environment: {
      id: '6f6d6387-6577-11e8-993a-f07959157220',
      createdWhen: '2018-06-01 10:40:27.97536195 +0200 CEST',
      state: 'CONFIGURED',
      tasks: []
    },
    workflow: {}
  };
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
          environments: [envTest]
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
      }
    });
    server.bind(address, credentials);
    server.start();

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
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
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

  describe('page status', () => {
    it('should load', async () => {
      await page.goto(url + '?page=status', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=status');
    });

    it('should have gotten data from getFrameworkInfo', async () => {
      assert(calls['getFrameworkInfo'] === true);
    });
  });

  describe('page environments', () => {
    it('should load', async () => {
      await page.goto(url + '?page=environments', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=environments');
    });

    it('should have gotten data from getEnvironments', async () => {
      assert(calls['getEnvironments'] === true);
    });
  });

  describe('page environment', () => {
    it('should load', async () => {
      await page.goto(url + '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220');
    });

    it('should have gotten data from getEnvironment', async () => {
      assert(calls['getEnvironment'] === true);
    });

    it('should have one button for locking', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
      const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      assert.deepStrictEqual(lockButton, 'Lock is free');
    });

    // LOCK Actions
    it('should click START button and do nothing due to `Control is not locked`', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)').click());
      await page.waitFor(2000);
      const state = await page.evaluate(() => {
        return window.model.environment.itemControl.payload;
      });
      assert.deepStrictEqual(state, 'Request to server failed (403 Forbidden): Control is not locked');
    });

    it('should click LOCK button', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
      const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      assert.deepStrictEqual(lockButton, '');
    });

    // CONFIGURED STATE
    it('should have one button for START in state CONFIGURED', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
      const startButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(1)').title);
      assert.deepStrictEqual(startButton, 'START');
    });

    it('should have one button hidden for STOP in state CONFIGURED', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
      const stopButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(2)').title);
      const stopButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(2)').style);
      assert.deepStrictEqual(stopButtonTitle, `'STOP' cannot be used in state 'CONFIGURED'`);
      assert.deepStrictEqual(stopButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for CONFIGURE in state CONFIGURED', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(3)', {timeout: 5000});
      const configureButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(3)').title);
      const configureButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(3)').style);
      assert.deepStrictEqual(configureButtonTitle, `'CONFIGURE' cannot be used in state 'CONFIGURED'`);
      assert.deepStrictEqual(configureButtonStyle, {0: 'display'});
    });

    it('should have one button for RESET in state CONFIGURED', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
      const configuredStateButtons = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(4)').title);
      assert.deepStrictEqual(configuredStateButtons, 'RESET');
    });

    // RUNNING STATE
    it('should click START button to move states (CONFIGURED -> RUNNING)', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)').click());
      await page.waitFor(200);
      const state = await page.evaluate(() => {
        return window.model.environment.item.payload.environment.state;
      });
      assert.deepStrictEqual(state, 'RUNNING');
    });

    it('should have gotten data from controlEnvironment', async () => {
      assert(calls['controlEnvironment'] === true);
    });

    it('should have one button hidden for START in state RUNNING', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
      const startButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').title);
      const startButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').style);
      assert.deepStrictEqual(startButtonTitle, `'START' cannot be used in state 'RUNNING'`);
      assert.deepStrictEqual(startButtonStyle, {0: 'display'});
    });

    it('should have one button for STOP in state RUNNING', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
      const stopButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').title);
      assert.deepStrictEqual(stopButton, 'STOP');
    });

    it('should have one button hidden for CONFIGURE in state RUNNING', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(3)', {timeout: 5000});
      const configureButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(3)').title);
      const configureButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(3)').style);
      assert.deepStrictEqual(configureButtonTitle, `'CONFIGURE' cannot be used in state 'RUNNING'`);
      assert.deepStrictEqual(configureButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for RESET in state RUNNING', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
      const resetButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').title);
      const resetButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').style);
      assert.deepStrictEqual(resetButtonTitle, `'RESET' cannot be used in state 'RUNNING'`);
      assert.deepStrictEqual(resetButtonStyle, {0: 'display'});
    });

    // STANDBY STATE

    it('should click STOP then RESET button states (RUNNING -> CONFIGURED -> STANDBY)', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
      // click STOP
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)').click());
      await page.waitFor(200);
      const configuredState = await page.evaluate(() => {
        return window.model.environment.item.payload.environment.state;
      });
      assert.deepStrictEqual(configuredState, 'CONFIGURED');
      // click RESET
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)').click());
      await page.waitFor(200);
      const standbyState = await page.evaluate(() => {
        return window.model.environment.item.payload.environment.state;
      });
      assert.deepStrictEqual(standbyState, 'STANDBY');
    });

    it('should have one button hidden for START in state STANDBY', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
      const startButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').title);
      const startButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').style);
      assert.deepStrictEqual(startButtonTitle, `'START' cannot be used in state 'STANDBY'`);
      assert.deepStrictEqual(startButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for STOP in state STANDBY', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
      const stopButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').title);
      const stopButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').style);
      assert.deepStrictEqual(stopButtonTitle, `'STOP' cannot be used in state 'STANDBY'`);
      assert.deepStrictEqual(stopButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for CONFIGURE in state STANDBY', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(3)', {timeout: 5000});
      const configureButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(3)').title);
      assert.deepStrictEqual(configureButtonTitle, `CONFIGURE`);
    });

    it('should have one button hidden for RESET in state STANDBY', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
      const resetButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').title);
      const resetButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').style);
      assert.deepStrictEqual(resetButtonTitle, `'RESET' cannot be used in state 'STANDBY'`);
      assert.deepStrictEqual(resetButtonStyle, {0: 'display'});
    });

    it('should click LOCK button to remove control', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
      await page.waitFor(200);
      const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      assert.deepStrictEqual(lockButton, 'Lock is free');
    });
  });

  beforeEach(() => {
    this.ok = true;
  });

  afterEach(() => {
    if (!this.ok) throw new Error('something went wrong');
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
