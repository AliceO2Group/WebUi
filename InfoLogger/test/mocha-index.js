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

/* eslint-disable no-console */
const puppeteer = require('puppeteer');
const assert = require('assert');
const {spawn} = require('child_process');

const config = require('./test-config.js');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('InfoLogger', function() {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  
  this.timeout(30000);
  this.slow(1000);
  
  const baseUrl = `http://${config.http.hostname}:${config.http.port}/`;

  before(async () => {
    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => subprocessOutput += chunk.toString());
    subprocess.stderr.on('data', (chunk) => subprocessOutput += chunk.toString());
    subprocess.on('error', (error) => console.error(`Server failed due to: ${error}`))

    // Start infologgerserver simulator
    require('./live-simulator/infoLoggerServer.js');

    // Start browser to test UI
    browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    page = await browser.newPage();

    // Export page and configurations for the other mocha files
    exports.page = page;
    exports.helpers = {baseUrl, jwt: config.jwt};
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(baseUrl, {waitUntil: 'networkidle0'});
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

  it('should have redirected to default page "/?q={"severity":{"in":"I W E F"}}"', async function() {
    await page.goto(baseUrl, {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);

    assert.deepStrictEqual(search, '?q={"severity":{"in":"I W E F"}}');
  });

  require('./public/mocha-user-actions');
  require('./public/mocha-log-filter-actions');
  require('./public/mocha-live-mode');
  require('./public/mocha-query-mode');
  require('./public/mocha-utils');

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log('---------------------------------------------');
    console.log(subprocessOutput);
    console.log('---------------------------------------------');
    subprocess.kill();
  });
});

