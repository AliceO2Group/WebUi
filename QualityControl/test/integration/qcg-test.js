/* eslint-disable no-invalid-this */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const puppeteer = require('puppeteer');
const assert = require('assert');

let page;
describe('QCG', function() {
  let browser;
  this.timeout(10000);
  this.slow(1000);
  const url = 'http://localhost:8082/';

  before(async () => {
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
    let testConfig;
    try {
      testConfig = require('./test-config');
    } catch (error) {
      console.warn('`test-config.js` file could not be found. Will use default values.');
    }
    exports.timeout = (testConfig && testConfig.timeout) ? testConfig.timeout : 2000;
    exports.page = page;
    exports.url = (testConfig && testConfig.hostname && testConfig.port) ? `http://${testConfig.hostname}:${testConfig.port}/` : url;
    exports.offlineObjects = (testConfig && testConfig.offlineObjects) ? testConfig.offlineObjects : ['qc/checks/TST/QcCheck', 'qc/DAQ/dataDistribution/payloadSize'];
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, {waitUntil: 'networkidle0'});
        break; // connection ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=objectTree"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=objectTree', 'Could not load home page of QCG');
  });

  require('./offline-mode.js');
  require('./online-mode.js');

  beforeEach(() => {
    this.ok = true;
  });

  afterEach(() => {
    if (!this.ok) {
      throw new Error('Something went wrong. Please use "systemctl status o2-cog for more information"');
    }
  });

  after(async () => {
    await browser.close();
  });
});
