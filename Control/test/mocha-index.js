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

describe('Control', function () {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(5000);
  this.slow(1000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  const calls = {}; // Object.<string:method, bool:flag> memorize that gRPC methods have been called indeed

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
        console.log('call to getFrameworkInfo done');
        calls['getFrameworkInfo'] = true;
        callback(null, {fakeData: 1});
      },
      getEnvironments(call, callback) {
        calls['getEnvironments'] = true;
        const responseData = {
          frameworkId: '74917838-27cb-414d-bfcd-7e74f85d4926-0000',
          environments:[
            {
              id: '6f6d6387-6577-11e8-993a-f07959157220',
              createdWhen: '2018-06-01 10:40:27.97536195 +0200 CEST',
              state: 'CONFIGURED',
            }
          ]
        };
        callback(null, responseData);
      },
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
    page.on('error', pageerror => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('pageerror', pageerror => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('console', msg => {
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
      } catch(e) {
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

    it('should have gotten data from getEnvironments', async () => {
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

