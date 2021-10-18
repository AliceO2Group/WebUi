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
const {coreGRPCServer} = require('./config/core-grpc.js');
const {apricotGRPCServer} = require('./config/apricot-grpc.js');

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


  before(async () => {
    // Start gRPC server, this replaces the real O2CORE server written in Go.
    const {calls} = coreGRPCServer(config);
    // Start gRPC server, this replaces the real APRICOT server written in Go.
    const {calls: apricotCalls} = apricotGRPCServer(config);
    
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
    await page.setViewport({ width: 1200, height: 770});
    exports.page = page;
    const helpers = {url, calls, apricotCalls};
    exports.helpers = helpers;
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

  it('should select detector view GLOBAL and redirect to environments page', async() => {
    const [label] = await page.$x(`//div/button[@id="GLOBALViewButton"]`);
    if (label) {
      await label.click();
      await page.waitForTimeout(200);
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=environments');
    } else {
      assert.ok(false, `Unable to click GLOBAL View`);
    }
  });

  it('should successfully set selected detector', async() => {
    const selected = await page.evaluate(() => window.model.detectors.selected);
    assert.strictEqual(selected, 'GLOBAL');
  });

  it ('should successfully display detector view header', async() => {
    const detectorViewLabel = await page.evaluate(() => {
      return document.querySelector(
        'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > h4').innerText;
    });
    assert.strictEqual(detectorViewLabel, 'Detector View: GLOBAL')
  });

  it('should have correctly load COG configuration', async () => {
    const cog = await page.evaluate(() => window.COG);
    const expectedConf = {
      ILG_URL: 'localhost:8081',
      BKP_URL: 'http://localhost:2021',
      QCG_URL: 'http://localhost:2022',
      GRAFANA: {
        status: true,
        plots: [
          'http://localhost:2020/d-solo/TZsAxKIWk/readout?orgId=1&panelId=6&refresh=5s&theme=light',
          'http://localhost:2020/d-solo/TZsAxKIWk/readout?orgId=1&panelId=8&refresh=5s&theme=light',
          'http://localhost:2020/d-solo/TZsAxKIWk/readout?orgId=1&panelId=4&refresh=5s&theme=light',
          'http://localhost:2020/d-solo/HBa9akknk/dd?orgId=1&panelId=10&refresh=5s&theme=light'
        ]
      },
      CONSUL: {
        hostname: 'localhost',
        port: 8550,
        flpHardwarePath: 'test/o2/hardware/flps',
        readoutPath: 'test/o2/readout/components',
        readoutCardPath: 'test/o2/readoutcard/components',
        qcPath: 'test/o2/qc/components',
        kVPrefix: 'test/ui/some-cluster/kv',
        kvStoreQC: 'localhost:8550/test/ui/some-cluster/kv/test/o2/qc/components',
        kvStoreReadout: 'localhost:8550/test/ui/some-cluster/kv/test/o2/readout/components',
        qcPrefix: "localhost:8550/test/o2/qc/components/",
        readoutPrefix: "localhost:8550/test/o2/readout/components/"
      },
      REFRESH_TASK: 5000,
      REFRESH_ENVS: 10000,
    }
    assert.deepStrictEqual(cog, expectedConf, 'Public configuration was not loaded successfully');
  });

  it('should have redirected to default page "/?page=environments"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.ok(location.search === '?page=environments');
  });

  require('./public/page-new-environment-mocha');
  require('./public/page-about-mocha');
  require('./public/page-environment-mocha');
  require('./public/page-environments-mocha');
  // require('./public/page-configuration-mocha');
  require('./public/page-tasks-mocha');

  beforeEach(() => this.ok = true);

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
