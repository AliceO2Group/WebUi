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
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false});
    page = await browser.newPage();
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

  it('should have redirected to default page "/?page=environments"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=environments', 'Could not load home page of AliECS GUI');
  });

  describe('Check if lock is acquired', () => {
    it('should successfully request LOCK if it is not already taken', async () => {
      let lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      if (lockButton !== 'Lock is taken by Anonymous (id 0)') {
        await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
        await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
        await page.waitFor(1000);
      }
      lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      assert.strictEqual(lockButton, 'Lock is taken by Anonymous (id 0)', 'Lock might be taken by another user');
    });
  });

  require('./create-new-environment');
  // require('./control-environment.js');

  describe('Release lock', () => {
    it('should successfully release LOCK if it is not already released', async () => {
      let lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      if (lockButton !== 'Lock is free') {
        await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
        await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
        await page.waitFor(1000);
      }
      lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    });
  });

  after(async () => {
    await browser.close();
  });
});
