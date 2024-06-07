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
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./config-provider');

let page;
const url = config.url;
describe('Control', function() {
  let browser;
  this.timeout(config.timeout);
  this.slow(3000);

  before(async () => {
    // Start browser to test UI
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new'});
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 770});
    exports.page = page;
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
      assert.strictEqual(location.search, '?page=environments','Detector unable to select view');
    } else {
      assert.ok(false, `Unable to click GLOBAL View`);
    }
  });

  it('should successfully set selected detector', async() => {
    const selected = await page.evaluate(() => window.model.detectors.selected);
    assert.strictEqual(selected, 'GLOBAL');
  });

  it('should have redirected to default page "/?page=environments"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=environments', 'Could not load home page of AliECS GUI');
    await page.waitForTimeout(4000);
  });

  require('./create-new-environment');
  require('./control-environment.js');

  after(async () => {
    await browser.close();
  });
});
